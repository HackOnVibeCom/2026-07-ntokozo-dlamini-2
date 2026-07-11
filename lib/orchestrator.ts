import type { CampaignStage, SwarmState } from "./types";

export type ExecutionStep = (state: SwarmState) => Promise<Partial<SwarmState["payload"]>>;

const ROUTING_MAP: Record<CampaignStage, CampaignStage> = {
  INITIALIZE: "STRATEGIZE",
  STRATEGIZE: "COPYWRITING",
  COPYWRITING: "ASSET_GENERATION",
  ASSET_GENERATION: "PROJECTION",
  PROJECTION: "COMPLETE",
  COMPLETE: "COMPLETE",
};

export class CampaignSwarmOrchestrator {
  private state: SwarmState;
  private nodes: Record<Exclude<CampaignStage, "INITIALIZE" | "COMPLETE">, ExecutionStep>;

  constructor(initialPayload: SwarmState["payload"], nodes: Record<Exclude<CampaignStage, "INITIALIZE" | "COMPLETE">, ExecutionStep>, provider: SwarmState["provider"]) {
    this.state = {
      currentStage: "INITIALIZE",
      provider,
      payload: initialPayload,
    };
    this.nodes = nodes;
  }

  getState(): SwarmState {
    return { ...this.state, payload: { ...this.state.payload } };
  }

  async executeNextStep(): Promise<SwarmState> {
    const stage = this.state.currentStage;
    if (stage === "COMPLETE") return this.getState();
    const step = this.nodes[stage as Exclude<CampaignStage, "INITIALIZE" | "COMPLETE">];
    if (step) {
      const delta = await step(this.state);
      this.state.payload = { ...this.state.payload, ...delta };
    }
    this.state.currentStage = ROUTING_MAP[stage];
    return this.getState();
  }
}
