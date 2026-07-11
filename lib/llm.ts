// LLM provider abstraction.
// Cloud path: any OpenAI-compatible /chat/completions endpoint with tool calling
// (NVIDIA NIM by default; also works with a LAN-exposed Ollama/LM Studio/llama.cpp).
// Offline path: deterministic Mock (handled in agents.ts via seeded generators).
// Selection probes the endpoint at run start and falls back to Mock if unreachable.

export interface ToolDef {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>; // JSON Schema
  };
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface CloudConfig {
  baseURL: string;
  apiKey: string;
  model: string;
}

export type ProviderSelection =
  | { kind: "cloud"; provider: CloudProvider }
  | { kind: "mock" };

export class CloudProvider {
  constructor(private cfg: CloudConfig) {}
  get model() {
    return this.cfg.model;
  }
  get baseURL() {
    return this.cfg.baseURL;
  }

  async completeWithTool(
    system: string,
    user: string,
    tools: ToolDef[],
    timeoutMs = 45_000,
  ): Promise<ToolCall[]> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`${this.cfg.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: this.cfg.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          tools,
          tool_choice: "auto",
          stream: false,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`LLM HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      const data = (await res.json()) as {
        choices?: Array<{
          message?: {
            tool_calls?: Array<{
              function?: { name?: string; arguments?: string };
            }>;
          };
        }>;
      };
      const calls = data.choices?.[0]?.message?.tool_calls ?? [];
      return calls
        .map((c) => {
          const name = c.function?.name ?? "";
          const raw = c.function?.arguments ?? "{}";
          try {
            return { name, args: JSON.parse(raw) as Record<string, unknown> };
          } catch {
            return null;
          }
        })
        .filter((c): c is ToolCall => c !== null && c.name !== "");
    } finally {
      clearTimeout(timer);
    }
  }

  // Quick reachability check (4s timeout). Returns false on any failure.
  async isReachable(): Promise<boolean> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    try {
      const res = await fetch(`${this.cfg.baseURL}/models`, {
        headers: { Authorization: `Bearer ${this.cfg.apiKey}` },
        signal: ctrl.signal,
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}

function buildCloudConfig(): CloudConfig | null {
  const apiKey = process.env.LLM_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    baseURL: (process.env.LLM_BASE_URL ?? "https://integrate.api.nvidia.com/v1").trim().replace(/\/$/, ""),
    apiKey,
    model: (process.env.LLM_MODEL ?? "meta/llama-3.1-8b-instruct").trim(),
  };
}

// Run-start provider selection: cloud if configured AND reachable, else mock.
// Also supports manual override via `force=cloud|mock` query param for demos.
export async function selectProvider(force?: "cloud" | "mock"): Promise<ProviderSelection> {
  if (force === "mock") return { kind: "mock" };
  if (force === "cloud") {
    const cfg = buildCloudConfig();
    if (!cfg) return { kind: "mock" };
    const provider = new CloudProvider(cfg);
    const ok = await provider.isReachable().catch(() => false);
    return ok ? { kind: "cloud", provider } : { kind: "mock" };
  }
  const cfg = buildCloudConfig();
  if (!cfg) return { kind: "mock" };
  const provider = new CloudProvider(cfg);
  const ok = await provider.isReachable().catch(() => false);
  return ok ? { kind: "cloud", provider } : { kind: "mock" };
}
