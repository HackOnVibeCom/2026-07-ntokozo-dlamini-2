export type CampaignStage =
  | "INITIALIZE"
  | "STRATEGIZE"
  | "COPYWRITING"
  | "ASSET_GENERATION"
  | "PROJECTION"
  | "COMPLETE";

export interface AgentPayload {
  appName: string;
  targetAudience: string;
  category: string;
  storeUrl: string;
  marketingBudget: number;
  designShare: number;
  channels: string[];
  campaignStrategy?: string;
  sloganText?: string;
  copyAssets?: Record<string, string>;
  svgMarkupContent?: string;
  palette?: { bg: string; primary: string; secondary: string; accent: string };
  projectionReport?: LaunchMetricsReport;
  qualityReport?: QualityReport;
}

export interface SwarmState {
  currentStage: CampaignStage;
  provider: "nim" | "mock";
  payload: AgentPayload;
}

export interface TraceEvent {
  event_id: number;
  run_id: string;
  agent_role: string;
  narrative: string;
  stage: CampaignStage;
  kind: "think" | "tool" | "handoff" | "complete" | "error";
  timestamp: string;
}

export interface LaunchMetricsReport {
  targetAdSpend: number;
  projectedImpressions: number;
  projectedClicks: number;
  asoScaleFactor: number;
  calculatedPaidInstalls: number;
  organicKFactorMultiplier: number;
  totalProjectedInstalls: number;
}

export interface QualityReport {
  overallScore: number;
  passedQualityChecks: boolean;
  warningsList: string[];
}

export const STAGE_ORDER: CampaignStage[] = [
  "INITIALIZE",
  "STRATEGIZE",
  "COPYWRITING",
  "ASSET_GENERATION",
  "PROJECTION",
  "COMPLETE",
];

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export const AGENT_LABELS: Record<string, string> = {
  INITIALIZE: "System Orchestrator",
  STRATEGIZE: "Planner Agent",
  COPYWRITING: "Copywriter + Community Agent",
  ASSET_GENERATION: "Designer Agent",
  PROJECTION: "Analyst Agent",
  COMPLETE: "Swarm Complete",
};
