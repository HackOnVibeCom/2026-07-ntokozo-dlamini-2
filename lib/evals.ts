export interface QualityReport {
  overallScore: number; // Graduated evaluation metric mapped 1-5
  passedQualityChecks: boolean;
  warningsList: string[];
}

export function evaluateGeneratedAssets(
  adCopy: string,
  svgVectorMarkup: string
): QualityReport {
  const warningsList: string[] = [];
  let score = 5.0;

  // Rule 1: Structural verification of the SVG asset
  const hasClosingTag = svgVectorMarkup.includes("</svg>");
  const hasDimensions = svgVectorMarkup.includes("width=") && svgVectorMarkup.includes("height=");
  if (!hasClosingTag || !hasDimensions) {
    score -= 2.0;
    warningsList.push("Generated vector poster has missing container markers or scale attributes.");
  }

  // Rule 2: Validation of copywriting content length
  if (adCopy.length < 40) {
    score -= 1.0;
    warningsList.push("Generated copy falls below minimum campaign length standards.");
  }

  // Rule 3: Protection against template placeholders
  const templateKeywords = [/placeholder/i, /your logo/i, /insert app/i, /lorem ipsum/i];
  const containsPlaceholders = templateKeywords.some((pattern) => pattern.test(adCopy));
  if (containsPlaceholders) {
    score -= 1.5;
    warningsList.push("Marketing outputs contain un-parsed placeholder structures.");
  }

  // Rule 4: SVG element count sanity check
  const elementCount = (svgVectorMarkup.match(/<[^>]+>/g) || []).length;
  if (elementCount < 5) {
    score -= 1.0;
    warningsList.push("SVG appears unusually sparse - may be malformed.");
  }

  return {
    overallScore: Math.max(1.0, score),
    passedQualityChecks: score >= 3.0,
    warningsList,
  };
}

/**
 * Runs a quick self-critique on agent output before presenting to user.
 * Returns a refined version if issues found, otherwise original.
 */
export function selfCritiqueAndRefine(
  adCopy: string,
  svgMarkup: string
): { refinedCopy: string; refinedSvg: string; report: QualityReport } {
  const report = evaluateGeneratedAssets(adCopy, svgMarkup);

  // If critical issues, attempt simple fixes
  let refinedCopy = adCopy;
  let refinedSvg = svgMarkup;

  if (report.warningsList.some((w) => w.includes("placeholder"))) {
    // Remove common placeholder patterns
    refinedCopy = adCopy
      .replace(/\[.*?\]/g, "")
      .replace(/\{.*?\}/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (report.warningsList.some((w) => w.includes("sparse"))) {
    // Ensure SVG has basic structure
    if (!refinedSvg.includes("<svg")) {
      refinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200"><rect width="800" height="1200" fill="#0b1329"/></svg>`;
    }
  }

  return { refinedCopy, refinedSvg, report };
}