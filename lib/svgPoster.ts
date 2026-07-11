export function renderDeclarativeSVGPoster(
  appName: string,
  tagline: string,
  palette: { bg: string; primary: string; secondary: string; accent: string },
  category?: string,
): string {
  const escapeXML = (raw: string) =>
    raw.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case '"': return "&quot;";
        default: return c;
      }
    });

  const app = escapeXML(appName);
  const promo = escapeXML(tagline);
  const initial = (appName || "?").charAt(0).toUpperCase();
  const nameHash = appName.split("").reduce((h, c) => h + c.charCodeAt(0), 0);

  // Decorative shapes seeded by name
  const arcCount = 3 + (nameHash % 3);
  const dotCount = 5 + (nameHash % 7);
  const ringOffset = (nameHash % 40) - 20;

  const dotPositions = Array.from({ length: dotCount }, (_, i) => {
    const angle = (i / dotCount) * Math.PI * 2 + (nameHash % 360) * Math.PI / 180;
    const rx = 400 + Math.cos(angle) * 340;
    const ry = 600 + Math.sin(angle) * 540;
    return { cx: rx.toFixed(1), cy: ry.toFixed(1), r: (1.5 + (i % 3)).toFixed(1), opacity: (0.12 + (i % 4) * 0.04).toFixed(2) };
  });

  const accentLines = Array.from({ length: 4 }, (_, i) => ({
    x1: (100 + (i % 4) * 150).toFixed(0),
    y1: (80 + (i % 2) * 10).toFixed(0),
    x2: (700 - (i % 3) * 100).toFixed(0),
    y2: (80 + (i % 2) * 10).toFixed(0),
    op: (0.06 + (i % 3) * 0.02).toFixed(2),
  }));

  const arcs = Array.from({ length: arcCount }, (_, i) => ({
    r: (280 + i * 60).toFixed(0),
    op: (0.03 + i * 0.02).toFixed(2),
    sw: (1 + i * 0.5).toFixed(1),
  }));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200" width="100%" height="100%" role="img" aria-label="${app} launch poster">
  <defs>
    <radialGradient id="halo" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="${palette.primary}" stop-opacity="0.14"/>
      <stop offset="65%" stop-color="${palette.bg}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="spot" cx="75%" cy="25%" r="30%">
      <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="${palette.bg}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shineH" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${palette.primary}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${palette.primary}" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="${palette.primary}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="border"><rect width="800" height="1200" rx="28"/></clipPath>
  </defs>

  <!-- Background -->
  <rect width="800" height="1200" rx="28" fill="${palette.bg}"/>
  <rect width="800" height="1200" fill="url(#halo)" clip-path="url(#border)"/>
  <circle cx="650" cy="180" r="420" fill="url(#spot)" clip-path="url(#border)"/>

  <!-- Decorative accent lines -->
  ${accentLines.map((l) => `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="${palette.secondary}" stroke-opacity="${l.op}" stroke-width="1"/>`).join("\n  ")}

  <!-- Orbital arcs -->
  ${arcs.map((a) => `<circle cx="400" cy="600" r="${a.r}" fill="none" stroke="${palette.primary}" stroke-opacity="${a.op}" stroke-width="${a.sw}"/>`).join("\n  ")}

  <!-- Faint constellation dots -->
  ${dotPositions.map((d) => `<circle cx="${d.cx}" cy="${d.cy}" r="${d.r}" fill="${palette.accent}" opacity="${d.opacity}"/>`).join("\n  ")}

  <!-- App icon block -->
  <g transform="translate(400, 260)">
    <rect x="-72" y="-72" width="144" height="144" rx="38" fill="${palette.primary}"/>
    <rect x="-72" y="-72" width="144" height="144" rx="38" fill="none" stroke="${palette.accent}" stroke-width="2" stroke-opacity="0.3"/>
    <text x="0" y="26" font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-size="72" fill="${palette.bg}" text-anchor="middle">${initial}</text>
    <circle cx="52" cy="-52" r="16" fill="${palette.accent}" opacity="0.9"/>
  </g>

  <!-- App name -->
  <text x="400" y="470" font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-size="52" fill="#fafafa" letter-spacing="6" text-anchor="middle">${app.toUpperCase()}</text>

  <!-- Divider -->
  <rect x="350" y="505" width="100" height="5" rx="2.5" fill="${palette.accent}"/>

  <!-- Tagline wrapped into 3 lines -->
  <text x="400" y="625" font-family="system-ui,-apple-system,sans-serif" font-weight="500" font-size="24" fill="${palette.secondary}" text-anchor="middle">
    ${(() => {
      const words = tagline.split(" ");
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        if ((line + " " + w).length > 42 && line.length > 0) {
          lines.push(line); line = w;
        } else {
          line = line ? line + " " + w : w;
        }
      }
      if (line) lines.push(line);
      return lines.slice(0, 3).map((txt, i) =>
        `<tspan x="400" dy="${i === 0 ? 0 : 46}">${escapeXML(txt)}</tspan>`
      ).join("\n    ");
    })()}
  </text>

  <!-- Feature callout strip -->
  <rect x="180" y="870" width="440" height="120" rx="18" fill="${palette.primary}" fill-opacity="0.04" stroke="${palette.primary}" stroke-opacity="0.3" stroke-width="1.5"/>
  <text x="400" y="918" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="20" fill="${palette.primary}" text-anchor="middle" letter-spacing="4">SWARM CAMPAIGN DEPLOYED</text>
  <text x="400" y="955" font-family="system-ui,-apple-system,sans-serif" font-weight="600" font-size="14" fill="${palette.accent}" text-anchor="middle">${category ? category.toUpperCase() : "APP"} · OFFLINE-VERIFIED (T-002)</text>

  <!-- Footer line -->
  <text x="400" y="1140" font-family="system-ui,-apple-system,sans-serif" font-weight="700" font-size="12" fill="${palette.secondary}" fill-opacity="0.5" letter-spacing="4" text-anchor="middle">DECISION ARCHITECTURE GRAPH BY OFFLINE TS ORCHESTRATOR</text>
</svg>`;
}