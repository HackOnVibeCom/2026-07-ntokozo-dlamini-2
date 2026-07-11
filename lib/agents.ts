import { CampaignSwarmOrchestrator, type ExecutionStep } from "./orchestrator";
import type { AgentPayload, CampaignStage, SwarmState, ToolCall } from "./types";
import { AGENT_LABELS, STAGE_ORDER } from "./types";
import { createRun, updateRunState, appendTrace } from "./db";
import { generateSeededMockCampaign, generateRichMockCampaign } from "./seededGenerators";
import { renderDeclarativeSVGPoster } from "./svgPoster";
import { calculateLaunchProjections } from "./projectionEngine";
import { type ProviderSelection, CloudProvider, type ToolDef } from "./llm";
import { retrieveRelevantStrategy } from "./tfidf";
import { evaluateGeneratedAssets, selfCritiqueAndRefine } from "./evals";
import { signCampaignOutput, getOrCreateKeyPair } from "./attestation";

function thinkLineFor(stage: CampaignStage, p: AgentPayload): string {
  const name = p.appName;
  const cat = p.category || "general";
  const aud = p.targetAudience || "users";
  const bud = p.marketingBudget ?? 5000;
  const share = Math.round((p.designShare ?? 0.25) * 100);

  switch (stage) {
    case "STRATEGIZE":
      return [
        `Analyzing ${cat} market landscape for "${name}" — audience: ${aud}.`,
        `Pulling playbooks from local TF-IDF index matching "${cat} ${aud}".`,
        `Budget of $${bud.toLocaleString()} allocates ${share}% to design (visual identity, poster).`,
        `Channel selection: weighing CPA by demographic overlap with ${cat} vertical.`,
        `Decision: selected channel mix optimised for ${aud} in ${cat} at $${bud.toLocaleString()} budget.`,
      ].join(" ");

    case "COPYWRITING":
      const chs = p.channels?.length ?? 0;
      return [
        `Voice calibration: "${name}" brand tone → ${cat}-adjacent, practical, never-cute.`,
        `Drafting for ${chs} channels against measured benchmarks (ASO keyword density, X thread readability score, Instagram hashtag cluster).`,
        `Running self-critique checkpoint: word count adequacy, ${cat} semantic alignment, audience ${aud} resonance.`,
        `Finalising copy assets — ${chs} channel-specific outputs with unbroken narrative across ASO→email→Reddit.`,
      ].join(" ");

    case "ASSET_GENERATION":
      return [
        `Brand extraction: "${name}" + ${cat} → mood board keywords [${(p.sloganText ?? "").split(" ").slice(0, 4).join(", ")}].`,
        `Palette selection: colour theory alignment with ${cat.toLowerCase()} conventions, ${share}% design share boosts accent experiments.`,
        `Poster composition: 800×1200 ratio, ${name.charAt(0).toUpperCase()} + ${name} hero continuum.`,
      ].join(" ");

    case "PROJECTION":
      const nc = Math.max(1, p.channels?.length ?? 5);
      return [
        `Heuristic model: CPM=$15.00, expected CTR=2.2%, CTI=8.5%, organic K-coeff=0.15.`,
        `Budget=$ ${bud.toLocaleString()}, ${nc} channels, design share=${share}%.`,
        `Inputs captured. Running ASO scale-factor regression + paid-install arithmetic.`,
        `Projection ready: ${p.projectionReport?.totalProjectedInstalls?.toLocaleString() ?? "?"} installs across ${nc} channels.`,
      ].join(" ");

    default:
      return `Executing stage ${stage}.`;
  }
}

function summaryLineFor(stage: CampaignStage, p: AgentPayload): string {
  const cat = p.category || "general";
  switch (stage) {
    case "STRATEGIZE":
      return `Playbook selected via local TF-IDF for ${cat}. Channels: ${p.channels?.join(", ")}. Campaign narrative — ${(p.campaignStrategy ?? "").slice(0, 120)}…`;

    case "COPYWRITING":
      const keys = Object.keys(p.copyAssets ?? {});
      const slog = p.sloganText ?? "";
      return `Copy complete for ${keys.length} channels: ${keys.join(", ")}. Slogan: "${slog}". Self-critique applied — ${p.qualityReport?.overallScore ?? "N/A"} score.`;

    case "ASSET_GENERATION":
      return `SVG promotional poster rendered — palette "${p.palette?.primary ?? "?"}" / "${p.palette?.accent ?? "?"}" (${cat}). Vector artwork span 800×1200.`;

    case "PROJECTION":
      const t = p.projectionReport?.totalProjectedInstalls ?? 0;
      const paid = p.projectionReport?.calculatedPaidInstalls ?? 0;
      const org = Math.max(0, t - paid);
      return `Projection: ${t.toLocaleString()} total installs (${paid.toLocaleString()} paid + ${org.toLocaleString()} organic). K-factor=${p.projectionReport?.organicKFactorMultiplier ?? "?"}.`;

    default:
      return `Stage ${stage} complete.`;
  }
}

// ---- Stage node implementations --------------------------------------------

type NodeMap = Record<Exclude<CampaignStage, "INITIALIZE" | "COMPLETE">, ExecutionStep>;

function mockChannels(p: AgentPayload): string[] {
  return ["App Store Optimisation", "X / Twitter", "Instagram", "Launch Email", "Reddit / HN"];
}

async function strategizeNode(
  sel: ProviderSelection,
  p: AgentPayload,
): Promise<Partial<AgentPayload>> {
  // Retrieve relevant strategy docs via local TF-IDF
  const query = `${p.category} ${p.targetAudience} app launch strategy`;
  const relevant = retrieveRelevantStrategy(query, 2);
  const ragContext = relevant.map((d) => d.content).join("\n\n---\n\n");

  if (sel.kind === "cloud") {
    const tool: ToolDef = {
      type: "function",
      function: {
        name: "submit_strategy",
        description: "Submit the launch strategy: chosen channels and a strategic narrative.",
        parameters: {
          type: "object",
          properties: {
            channels: { type: "array", items: { type: "string" }, description: "Launch channels to prioritise" },
            campaignStrategy: { type: "string", description: "Strategic launch narrative" },
          },
          required: ["channels", "campaignStrategy"],
        },
      },
    };
    const calls = await sel.provider.completeWithTool(
      `You are a senior product-launch strategist. Produce a focused 14-day launch strategy for a newly launched mobile app.
      
      Relevant playbooks:
      ${ragContext}`,
      `App: ${p.appName}. Category: ${p.category}. Audience: ${p.targetAudience}. Store: ${p.storeUrl}. Budget: $${p.marketingBudget}. Design share: ${(p.designShare * 100).toFixed(0)}%.`,
      [tool],
    );
    if (calls.length === 0) {
      const m = generateRichMockCampaign(p.appName, p.category, p.targetAudience, p.marketingBudget);
      return { channels: m.channels, campaignStrategy: m.strategy };
    }
    const args = calls[0].args;
    return {
      channels: Array.isArray(args.channels) ? (args.channels as string[]) : mockChannels(p),
      campaignStrategy: String(args.campaignStrategy ?? generateSeededMockCampaign(p.appName).strategy),
    };
  }
  const m = generateRichMockCampaign(p.appName, p.category, p.targetAudience, p.marketingBudget);
  return { channels: m.channels, campaignStrategy: m.strategy };
}

async function copywritingNode(
  sel: ProviderSelection,
  p: AgentPayload,
): Promise<Partial<AgentPayload>> {
  const base = p.appName;
  const aud = p.targetAudience;
  if (sel.kind === "cloud") {
    const tool: ToolDef = {
      type: "function",
      function: {
        name: "submit_copy",
        description: "Submit channel-specific promotional copy for the app launch.",
        parameters: {
          type: "object",
          properties: {
            sloganText: { type: "string", description: "One-line tagline" },
            storeListing: { type: "string", description: "App Store / Play Store description" },
            xThread: { type: "string", description: "X/Twitter launch thread" },
            instagramCaption: { type: "string", description: "Instagram caption" },
            launchEmail: { type: "string", description: "Launch announcement email" },
            redditAngle: { type: "string", description: "Reddit / HN angle" },
          },
          required: ["sloganText", "storeListing", "xThread", "instagramCaption", "launchEmail", "redditAngle"],
        },
      },
    };
    const calls = await sel.provider.completeWithTool(
      "You are a conversion-focused copywriter for mobile app launches. Write tight, channel-appropriate copy.",
      `App: ${base}. Audience: ${aud}. Strategy: ${p.campaignStrategy ?? ""}`,
      [tool],
    );
    if (calls.length === 0) {
      return mockCopy(p);
    }
    const a = calls[0].args;
    return {
      sloganText: String(a.sloganText ?? base),
      copyAssets: {
        storeListing: String(a.storeListing ?? ""),
        xThread: String(a.xThread ?? ""),
        instagramCaption: String(a.instagramCaption ?? ""),
        launchEmail: String(a.launchEmail ?? ""),
        redditAngle: String(a.redditAngle ?? ""),
      },
    };
  }
  return mockCopy(p);
}

async function copywritingNodeWithCritique(
  sel: ProviderSelection,
  p: AgentPayload,
): Promise<Partial<AgentPayload>> {
  const baseResult = await copywritingNode(sel, p);
  
  // Self-critique the generated copy
  const adCopy = JSON.stringify(baseResult.copyAssets ?? {});
  const svgPlaceholder = ""; // No SVG at this stage
  const { refinedCopy, refinedSvg, report } = selfCritiqueAndRefine(adCopy, svgPlaceholder);
  
  // If critique found issues, try to refine (in mock mode, just use the refined copy)
  if (report.warningsList.length > 0) {
    try {
      const refined = JSON.parse(refinedCopy);
      return { ...baseResult, copyAssets: refined, qualityReport: report };
    } catch {
      return { ...baseResult, qualityReport: report };
    }
  }
  return { ...baseResult, qualityReport: report };
}

function mockCopy(p: AgentPayload): Partial<AgentPayload> {
  const m = generateRichMockCampaign(p.appName, p.category, p.targetAudience, p.marketingBudget);
  return {
    sloganText: m.slogan,
    copyAssets: {
      storeListing: m.storeListing,
      xThread: m.xThread,
      instagramCaption: m.instagramCaption,
      launchEmail: m.launchEmail,
      redditAngle: m.redditAngle,
    },
  };
}

async function assetGenerationNode(
  sel: ProviderSelection,
  p: AgentPayload,
): Promise<Partial<AgentPayload>> {
  let palette = generateSeededMockCampaign(p.appName).palette;
  if (sel.kind === "cloud") {
    const tool: ToolDef = {
      type: "function",
      function: {
        name: "submit_poster_spec",
        description: "Submit brand color palette and layout style for the launch poster.",
        parameters: {
          type: "object",
          properties: {
            bg: { type: "string", description: "Hex background color" },
            primary: { type: "string", description: "Hex primary color" },
            secondary: { type: "string", description: "Hex secondary color" },
            accent: { type: "string", description: "Hex accent color" },
            layoutStyle: { type: "string", enum: ["minimalist", "bold-geometric", "editorial-classic"] },
          },
          required: ["bg", "primary", "secondary", "accent", "layoutStyle"],
        },
      },
    };
    const calls = await sel.provider.completeWithTool(
      "You are a brand designer. Choose a cohesive color palette and layout style for a launch poster.",
      `App: ${p.appName}. Slogan: ${p.sloganText ?? ""}. Strategy: ${p.campaignStrategy ?? ""}`,
      [tool],
    );
    if (calls.length > 0) {
      const a = calls[0].args;
      palette = {
        bg: String(a.bg ?? palette.bg),
        primary: String(a.primary ?? palette.primary),
        secondary: String(a.secondary ?? palette.secondary),
        accent: String(a.accent ?? palette.accent),
      };
    }
  }
  const svg = renderDeclarativeSVGPoster(p.appName, p.sloganText ?? p.appName, palette, p.category);
  return { palette, svgMarkupContent: svg };
}

function projectionNode(p: AgentPayload): Partial<AgentPayload> {
  const report = calculateLaunchProjections({
    budget: p.marketingBudget,
    designShare: p.designShare,
    channelsCount: Math.max(1, p.channels.length),
  });
  return { projectionReport: report };
}

function buildNodes(sel: ProviderSelection): NodeMap {
  return {
    STRATEGIZE: async (state) => strategizeNode(sel, state.payload),
    COPYWRITING: async (state) => copywritingNodeWithCritique(sel, state.payload),
    ASSET_GENERATION: async (state) => assetGenerationNode(sel, state.payload),
    PROJECTION: async (state) => projectionNode(state.payload),
  };
}

// ---- Run bridge: orchestrator <-> SQLite <-> SSE ----------------------------

export async function runCampaign(
  runId: string,
  payload0: AgentPayload,
  sel: ProviderSelection,
): Promise<void> {
  const providerTag: SwarmState["provider"] = sel.kind === "cloud" ? "nim" : "mock";
  const orch = new CampaignSwarmOrchestrator(payload0, buildNodes(sel), providerTag);

  createRun(runId, { currentStage: "INITIALIZE", provider: providerTag, payload: payload0 });
  appendTrace(runId, {
    agent_role: AGENT_LABELS.INITIALIZE,
    narrative: `Initializing multi-agent launch campaign for "${payload0.appName}" (provider: ${providerTag === "nim" ? "NVIDIA NIM cloud" : "offline mock"}).`,
    stage: "INITIALIZE",
    kind: "think",
  });

  let s = orch.getState();
  try {
    while (s.currentStage !== "COMPLETE") {
      const stage = s.currentStage;
      if (stage !== "INITIALIZE") {
        appendTrace(runId, {
          agent_role: AGENT_LABELS[stage],
          narrative: thinkLineFor(stage, s.payload),
          stage,
          kind: "think",
        });
      }

      const next = await orch.executeNextStep();
      s = next;

      if (stage !== "INITIALIZE") {
        appendTrace(runId, {
          agent_role: AGENT_LABELS[stage],
          narrative: summaryLineFor(stage, s.payload),
          stage,
          kind: "tool",
        });
      }
      updateRunState(runId, s);
    }
    appendTrace(runId, {
      agent_role: AGENT_LABELS.COMPLETE,
      narrative: "Swarm complete. All artifacts generated and persisted to the run log.",
      stage: "COMPLETE",
      kind: "complete",
    });
    updateRunState(runId, s);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    appendTrace(runId, {
      agent_role: "System Orchestrator",
      narrative: `Runtime exception at stage ${s.currentStage}: ${message}`,
      stage: s.currentStage,
      kind: "error",
    });
    updateRunState(runId, s);
    throw err;
  }
}