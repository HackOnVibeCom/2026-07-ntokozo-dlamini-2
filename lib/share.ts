import type { AgentPayload, LaunchMetricsReport } from "./types";

export interface ShareableCampaignState {
  appName: string;
  targetAudience: string;
  category: string;
  marketingBudget: number;
  designShare: number;
  channels: string[];
  campaignStrategy?: string;
  sloganText?: string;
  copyAssets?: Record<string, string>;
  svgMarkupContent?: string;
  palette?: { bg: string; primary: string; secondary: string; accent: string };
  projectionReport?: LaunchMetricsReport;
  runId: string;
  provider: "nim" | "mock";
  timestamp: string;
}

export function encodeStatePayload(state: ShareableCampaignState): string {
  // Create a minimal payload for URL sharing (exclude large SVG)
  const minimal = {
    ...state,
    svgMarkupContent: undefined, // Exclude large SVG from URL
  };
  const serialized = JSON.stringify(minimal);
  // URL-safe base64
  return btoa(unescape(encodeURIComponent(serialized)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeStatePayload(payload: string): ShareableCampaignState | null {
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(json) as ShareableCampaignState;
  } catch {
    return null;
  }
}

export function generateShareURL(state: ShareableCampaignState): string {
  const payload = encodeStatePayload(state);
  return `${window.location.origin}/swarm/shared?payload=${payload}`;
}

export function generateShortShareURL(state: ShareableCampaignState): string {
  // For very short URLs, only include essentials
  const minimal = {
    a: state.appName,
    t: state.targetAudience,
    c: state.category,
    b: state.marketingBudget,
    d: state.designShare,
    p: state.provider,
    ts: state.timestamp,
  };
  const serialized = JSON.stringify(minimal);
  return `${window.location.origin}/swarm/shared?s=${btoa(unescape(encodeURIComponent(serialized))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}