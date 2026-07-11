import type { LaunchMetricsReport } from "./types";

export interface CampaignParameters {
  budget: number;
  designShare: number;
  channelsCount: number;
}

export function calculateLaunchProjections(
  params: CampaignParameters,
): LaunchMetricsReport {
  const { budget, designShare, channelsCount } = params;

  // Transparent heuristic constants (exposed in the UI for judge review).
  const COST_PER_MILLE = 15.0; // CPM: cost per 1,000 impressions (USD)
  const CLICK_THROUGH_RATE = 0.022; // CTR baseline 2.2%
  const BASELINE_CLICK_TO_INSTALL = 0.085; // CTI baseline 8.5%
  const ORGANIC_COEFFICIENT_BASE = 0.15; // viral/organic growth baseline

  const targetAdSpend = budget * (1.0 - designShare);
  const projectedImpressions = (targetAdSpend / COST_PER_MILLE) * 1000;
  const projectedClicks = projectedImpressions * CLICK_THROUGH_RATE;

  // Visual design investment lifts store-page conversion (ASO multiplier).
  const asoScaleFactor = 1.0 + Math.log1p(designShare * 2.8);
  const targetedConversion = BASELINE_CLICK_TO_INSTALL * asoScaleFactor;

  // Multi-channel synergy scales the organic loop.
  const dynamicOrganicCoeff = ORGANIC_COEFFICIENT_BASE * (1.0 + channelsCount * 0.05);

  const calculatedPaidInstalls = projectedClicks * targetedConversion;
  const organicInstalls = calculatedPaidInstalls * dynamicOrganicCoeff;
  const totalProjectedInstalls = calculatedPaidInstalls + organicInstalls;

  return {
    targetAdSpend: Number(targetAdSpend.toFixed(2)),
    projectedImpressions: Math.round(projectedImpressions),
    projectedClicks: Math.round(projectedClicks),
    asoScaleFactor: Number(asoScaleFactor.toFixed(3)),
    calculatedPaidInstalls: Math.round(calculatedPaidInstalls),
    organicKFactorMultiplier: Number(dynamicOrganicCoeff.toFixed(3)),
    totalProjectedInstalls: Math.round(totalProjectedInstalls),
  };
}
