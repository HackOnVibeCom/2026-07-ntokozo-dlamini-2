export function generateFNV1aHash(text: string): number {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

export function createMulberry32(seed: number) {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let x = Math.imul(state ^ (state >>> 15), state | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  return {
    nextFloat: next,
    pick: <T>(options: T[]): T => {
      const f = next();
      return options[Math.floor(f * options.length)];
    },
    pickN: <T>(options: T[], n: number): T[] => {
      const copy = [...options];
      const out: T[] = [];
      for (let i = 0; i < n && copy.length > 0; i++) {
        const f = next();
        const idx = Math.floor(f * copy.length);
        out.push(copy.splice(idx, 1)[0]);
      }
      return out;
    },
    nextInt: (min: number, max: number): number => {
      return Math.floor(next() * (max - min + 1)) + min;
    },
  };
}

export interface ColorPalette {
  bg: string;
  primary: string;
  secondary: string;
  accent: string;
  name: string;
  mood: string;
}

interface CategoryBrief {
  themes: string[]; // narrative descriptors
  painPoints: string[];
  proofPoints: string[];
  channels: string[];
  primaryChannelMsg: string;
}

const CATEGORY_BRIEFS: Record<string, CategoryBrief> = {
  "Health & Fitness": {
    themes: ["habit-formation", "performance tracking", "mindful recovery", "streak motivation", "personal records"],
    painPoints: ["motivation slumps", "data scattered across apps", "no clear progress picture", "intimidating onboarding"],
    proofPoints: ["aggregate workout history", "weekly streak milestones", "video-form coaching cues", "nudge-based reminders"],
    channels: ["App Store Optimisation", "Instagram", "TikTok", "Reddit r/fitness", "Strava Community Partnerships"],
    primaryChannelMsg: "Meet people where they sweat — Instagram fitness creators + Strava communities",
  },
  "Food & Drink": {
    themes: ["meal simplicity", "pantry efficiency", "taste discovery", "allergen safety", "ritual joy"],
    painPoints: ["decision fatigue at dinner", "wasted groceries", "picky eaters at home", "fear of cross-contamination"],
    proofPoints: ["5-ingredient filter", "scan-to-eat labels", "weeknight dinner plans", "allergen badges"],
    channels: ["App Store Optimisation", "Pinterest", "Instagram (food creators)", "Recipe blogs (UGC backlinks)", "YouTube Shorts"],
    primaryChannelMsg: "Pinterest-first visual pinning + Instagram food creator conversions",
  },
  "Productivity": {
    themes: ["deep work", "context switching", "frictionless capture", "natural-language input", "calendar-timeboxing"],
    painPoints: ["tool fatigue", "no brain dump surface", "scattered inbox vs tasks", "decision paralysis"],
    proofPoints: ["one-tap capture", "AI-summarised action items", "calendar-aware cron", "macro-tracked progress"],
    channels: ["App Store Optimisation", "X / Twitter (founder-led)", "Reddit r/productivity", "Hacker News", "LinkedIn"],
    primaryChannelMsg: "Founder-led X/Twitter narrative arc — launch thread, changelog drops, dev diary",
  },
  "Finance": {
    themes: ["money clarity", "spend hygiene", "savings automation", "first-time investing", "debt payoff"],
    painPoints: ["money anxiety", "spreadsheets too cold", "fear of jargon", "no progress picture"],
    proofPoints: ["zero-based budget suggestions", "visuals not tabs", "FDIC-style plain language", "goal thermometers"],
    channels: ["App Store Optimisation", "Reddit r/personalfinance", "TikTok (creators)", "Newsletter partnerships", "LinkedIn finance pros"],
    primaryChannelMsg: "Trust-built Reddit AMA + personal-finance micro-video creators",
  },
  "Education": {
    themes: ["spaced repetition", "exam confidence", "concept-first learning", "low-stakes practice", "curiosity loops"],
    painPoints: ["passive re-reading", "test panic", "no immediate feedback", "tutorial hell"],
    proofPoints: ["active recall prompts", "adaptive difficulty", "streak XP", "flashcards you actually retain"],
    channels: ["App Store Optimisation", "YouTube (study-tubers)", "TikTok", "Reddit r/GetStudying", "Teacher newsletters"],
    primaryChannelMsg: "Study-tuber YouTube collaborations + TikTok day-in-life demos",
  },
  "Entertainment": {
    themes: ["binge intelligence", "discoverability", "mood matching", "social reco", "personal taste"],
    painPoints: ["scroll fatigue", "decision deadlocks", "broken watchlists", "abandoned trailers"],
    proofPoints: ["mood tags", "auto-watchlist sync", "social rank lists", "AI taste profile"],
    channels: ["App Store Optimisation", "TikTok", "Instagram", "Reddit r/movies", "YouTube trivia channels"],
    primaryChannelMsg: "TikTok 'this or that' movie trend + Instagram 'show me your watchlist'",
  },
  "Social Networking": {
    themes: ["real-world meetups", "low-pressure intros", "anti-scroll feed", "interest graphs", "micro-community trust"],
    painPoints: ["big-app burnout", "venting strangers", "ghost towns", "no local discovery"],
    proofPoints: ["interest-tagged meetups", "RSVP accountability", "slow-feed mode", "verified local anchors"],
    channels: ["App Store Optimisation", "Reddit AMAs", "Event listings (Meetup, Eventbrite)", "Substack newsletters", "TikTok"],
    primaryChannelMsg: "City-by-city meetup seeding with anchor hosts",
  },
};

const FALLBACK_BRIEF: CategoryBrief = {
  themes: ["usability", "delightful first run", "casual word-of-mouth", "frictionless sharing", "habit moments"],
  painPoints: ["unclear value prop", "cold first-use", "no clear reason to return"],
  proofPoints: ["instant value on launch", "share-to-earn hooks", "frictionless onboarding"],
  channels: ["App Store Optimisation", "X / Twitter", "Instagram", "Launch Email", "Reddit / HN"],
  primaryChannelMsg: "Founder-led X/Twitter narrative + Reddit Show HN drop",
};

const COLOR_PALETTES: ColorPalette[] = [
  { name: "Midnight Aurora", mood: "calm focused", bg: "#0a0f1f", primary: "#5eead4", secondary: "#818cf8", accent: "#fbbf24" },
  { name: "Carbon Pulse", mood: "bold minimal", bg: "#0c0c0e", primary: "#f97316", secondary: "#a3a3a3", accent: "#facc15" },
  { name: "Studio Violet", mood: "premium editorial", bg: "#13111c", primary: "#c084fc", secondary: "#7dd3fc", accent: "#fb7185" },
  { name: "Forest Pro", mood: "natural warm", bg: "#0f1c14", primary: "#34d399", secondary: "#fbbf24", accent: "#f87171" },
  { name: "Stark Mono", mood: "structural", bg: "#0a0a0a", primary: "#fafafa", secondary: "#a3a3a3", accent: "#22d3ee" },
  { name: "Rust Voyager", mood: "earthy", bg: "#1a0e08", primary: "#f97316", secondary: "#fef3c7", accent: "#65a30d" },
  { name: "Rose Neon", mood: "soft luxe", bg: "#1a0a14", primary: "#f472b6", secondary: "#c084fc", accent: "#5eead4" },
  { name: "Ocean Bench", mood: "deep clarity", bg: "#0a1822", primary: "#38bdf8", secondary: "#94a3b8", accent: "#fbbf24" },
];

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1));
}

function pick2<T>(rng: ReturnType<typeof createMulberry32>, arr: T[]): [T, T] {
  const picks = rng.pickN(arr, 2);
  return [picks[0], picks[1] ?? picks[0]];
}

function buildStrategyNarrative(
  rng: ReturnType<typeof createMulberry32>,
  appName: string,
  category: string,
  audience: string,
  budget: number,
): string {
  const brief = CATEGORY_BRIEFS[category] ?? FALLBACK_BRIEF;

  const [t1, t2] = pick2(rng, brief.themes);
  const [pain1, pain2] = pick2(rng, brief.painPoints);
  const [proof1, proof2] = pick2(rng, brief.proofPoints);

  const phase = rng.pick(["7-day ignition + 7-day amplification", "3-day whisper + 14-day amplification", "14-day sustained build"]);

  return `SWARM STRATEGY — ${appName} · ${category}

Primary bet: position ${appName} as the ${t1}-led alternative for ${audience} who feel underserved by incumbents. The wedge is ${proof1} — a clear, defensible moment that reframes an unsexy workflow as delightful, and removes ${pain1} without asking the user to change their toolchain.

Audience signal: ${audience} feel ${pain1} and ${pain2} when working with existing ${category.toLowerCase()} apps. They want: (1) faster time-to-first-value, (2) a visible sense of progress (${t2}), (3) exportability so the data stays theirs. ${appName} answers all three on the first screen.

Channel mix — ${phase}:
1. ${brief.primaryChannelMsg}. This is the warm-water channel — lowest CAC, highest intent.
2. Paid: App Store Optimisation (keyword reels), Instagram (creative sponsored creative tied to ${t2} use cases), and a ${category.toLowerCase()} Discord/subreddit partnership thread.
3. Organic: domain-credible Substack / newsletter backlinks; founder-led devlog on X/Twitter.
4. Influencer: ${rng.nextInt(3, 7)} mid-tier ${category.toLowerCase()} creators (15k–80k followers) given LTV-attribution links.

Brand thesis. Visual language: lean, confident, ${rng.pick(["monochrome with one accent for moments", "dark-first with warm accent for delight", "high-contrast editorial with functional whitespace"])}. Voice: practical, never breathless. The slogan should rhyme back to ${proof2}.

KPIs that matter (not vanity): day-1 → day-7 retention for ${audience}, time-to-first-a-ha (target ≤ 60s), ${proof1} completion rate, organic K-factor after week 1. We will NOT optimize for install counts in week 1 — only for ${proof1} completion. That becomes the word-of-mouth engine.

Risk register: incumbent copies the wedge in <90 days → mitigated by community-led ${t2} loop. Apple/Google policy change removes ${proof2} → mitigated by not depending on it. Creator rate-card inflation → cap payments, switch to revenue-share with the top 2.`;
}

function buildSlogan(
  rng: ReturnType<typeof createMulberry32>,
  appName: string,
  category: string,
  audience: string,
): string {
  const brief = CATEGORY_BRIEFS[category] ?? FALLBACK_BRIEF;
  const theme = rng.pick(brief.themes);
  const proof = rng.pick(brief.proofPoints);
  const pain = rng.pick(brief.painPoints);

  const templates = [
    `${appName}. ${titleCase(theme)} for ${audience}, minus the ${pain}.`,
    `${appName} — ${proof} built for ${audience}.`,
    `${titleCase(theme)}, finally frictionless. ${appName} for ${audience}.`,
    `Run on ${titleCase(theme)}. ${appName} — the ${category.toLowerCase()} shortcut for ${audience}.`,
    `${appName}. Less ${pain}, more ${theme}.`,
  ];
  return rng.pick(templates);
}

function buildStoreListing(
  rng: ReturnType<typeof createMulberry32>,
  appName: string,
  category: string,
  audience: string,
  slogan: string,
): string {
  const brief = CATEGORY_BRIEFS[category] ?? FALLBACK_BRIEF;
  const [proof1, proof2] = pick2(rng, brief.proofPoints);
  const [pain1] = pick2(rng, brief.painPoints);
  const bullets = rng.pickN(brief.proofPoints, 4).map((p, i) => `• ${titleCase(p)} — ${pickBenefitCopy(p)}`);

  return `${slogan}

${appName} is the ${category.toLowerCase()} app built specifically for ${audience}. No more ${pain1}. No more generic dashboards pretending to understand your life. ${titleCase(proof1)} lives at the centre of the experience, surrounded by quiet, opinionated design that gets out of your way the moment you tap in.

THE FIRST 60 SECONDS
Open the app. The first screen is the value prop, not a signup wall. ${titleCase(proof1)} works immediately, with a sample dataset if you haven't entered your own. The cursor lands where your hand expects. Nothing loads. Nothing nags. You finish your first ${proof1} cycle in under a minute and you have already won.

WHAT MAKES ${appName.toUpperCase()} DIFFERENT
${bullets.join("\n")}

• Designed for ${audience} — every default setting is pre-tuned. The onboarding survey asks three questions, then leaves you alone forever.
• No ads, ever — ${appName} is paid-by-the-user, not paid-by-the-advertiser. We're allergic to dark patterns.

WHY ${audience.toUpperCase()} SWITCH
${capitalize(audience)} tested 17 problems off our list before launch. The top three were: ${pain1}, generic onboarding that didn't reflect their life, and apps that felt like a 2014 dashboard. ${appName} replaces all three. The result is a tool that pays back its price in the first week, then keeps paying.

PRESS & EARLY REVIEWS
"${appName} is the ${category.toLowerCase()} app I keep open while the others are buried in a folder." — early-access user, ${audience}
"The ${proof2} flow is the cleanest I've seen this year." — TestFlight reviewer

Download ${appName}. Get a week for free. Cancel from the app in two taps if it's not for you.`;
}

function buildXThread(
  rng: ReturnType<typeof createMulberry32>,
  appName: string,
  category: string,
  audience: string,
  slogan: string,
): string {
  const brief = CATEGORY_BRIEFS[category] ?? FALLBACK_BRIEF;
  const [pain1] = pick2(rng, brief.painPoints);
  const [proof1, proof2] = pick2(rng, brief.proofPoints);
  const theme = rng.pick(brief.themes);

  return `1/ we just launched ${appName}.

${slogan}

a ${category.toLowerCase()} app for ${audience}, built after a year of saying "ugh, another generic dashboard".

2/ the bet: the ${category.toLowerCase()} app market is crowded on features, empty on point of view.

every existing app for ${audience} tries to be a spreadsheet wearing a costume. ${appName} is the opposite — starts with ${proof1}, then earns every other screen.

3/ what ${audience} actually said they hated:

• "${pain1}"
• tools that demand a 7-step setup before showing any value
• dashboards confusable with bank apps

we cut all three.

4/ the wedge: ${proof1}, on the first screen.

one tap. no account wall. if you have your own data, paste a CSV. if not, we ship a sample so you feel the loop in 20 seconds.

5/ the loop: ${theme} → ${proof2} → share → repeat.

this is what ${audience} asked for in interviews. nothing heroic. just well-built.

6/ offline-first, dark-by-default, no ads ever.

the early-access pass link is in the bio. first 500 ${audience} get a year free.

7/ build log + roadmap in the next thread. we publish every friday.

welcome. #${appName.replace(/\s+/g, "")} #${category.replace(/[^a-zA-Z]/g, "")}`;
}

function buildInstagramCaption(
  rng: ReturnType<typeof createMulberry32>,
  appName: string,
  category: string,
  audience: string,
  slogan: string,
): string {
  const brief = CATEGORY_BRIEFS[category] ?? FALLBACK_BRIEF;
  const theme = rng.pick(brief.themes);
  const proof = rng.pick(brief.proofPoints);
  const pain = rng.pick(brief.painPoints);

  return `${slogan} ✨

we built ${appName} because ${audience} deserve a ${category.toLowerCase()} app that doesn't open with a 7-step signup and end with "${pain}."

this is ${theme}, in your pocket.

swipe to see the first three screens 👉
1 — opens here. not a wall.
2 — ${proof}, your way.
3 — done. truly done. no nag.

tag a ${audience.slice(0, 24)} friend who's been let down by the ${category.toLowerCase()} shelf.

#${appName.replace(/\s+/g, "")} #${category.replace(/[^a-zA-Z]/g, "")} #${theme.replace(/\s+/g, "")}
#app #launchweek #${audience.split(" ")[0].toLowerCase()} #buildinpublic`;
}

function buildLaunchEmail(
  rng: ReturnType<typeof createMulberry32>,
  appName: string,
  category: string,
  audience: string,
  slogan: string,
): string {
  const brief = CATEGORY_BRIEFS[category] ?? FALLBACK_BRIEF;
  const [proof1] = pick2(rng, brief.proofPoints);
  const [pain1] = pick2(rng, brief.painPoints);

  return `Subject: ${appName} is live — and it opens with the value, not a wall

Hi [first name],

We just shipped ${appName}. ${slogan} — built for ${audience}, with a 12-month beta with 600+ of you.

Why we built this
We watched ${audience} fight through ${pain1} for years — across apps that looked pretty and helped no one. ${appName} starts with ${proof1} on the first screen. No signup wall. No tutorial. The value loop is the onboarding.

What's new in 1.0
• ${proof1} works offline, with sample data if you haven't added yours yet
• A clean ${category} workflow that gets out of your way after one tap
• Export to CSV/Markdown anytime — your data, your file

Pricing
First week free. Cancel from inside the app in two taps. After that $4.99/month or $39/year — one tier, no upsell maze.

Get a week free → [download link]

If you reply to this email, it goes to the founders, not a queue. We read every reply.

— The ${appName} team
P.S. The build log lives at [link]. We ship every Friday.`;
}

function buildRedditAngle(
  rng: ReturnType<typeof createMulberry32>,
  appName: string,
  category: string,
  audience: string,
  slogan: string,
): string {
  const brief = CATEGORY_BRIEFS[category] ?? FALLBACK_BRIEF;
  const [proof1, proof2] = pick2(rng, brief.proofPoints);
  const [pain1] = pick2(rng, brief.painPoints);

  return `Show HN / Reddit: ${appName} — ${slogan}

Hi everyone — long-time lurker, ${category.toLowerCase()} practitioner. After a year of side-project nights and weekends I just shipped ${appName}.

The pitch in one line: a ${category.toLowerCase()} app for ${audience} that opens with ${proof1} on the first screen, instead of a 7-step onboarding. Free for the first week. Built with [insert stack] + offline-first.

Why
Every existing ${category.toLowerCase()} app for ${audience} I tried hit the same wall for me: ${pain1}, plus an interface that looks like a 2014 bank app. ${appName} is opinionated — defaults tuned for ${audience}, no upsell tier maze, no ads, your data is exportable as a Markdown file from day one.

What I learned shipping it
- The hardest feature was deciding what to cut. I built ${proof2} three times and scrapped it twice before it felt honest.
- Offline-first is Not Free. IndexedDB + race conditions eat weekends. Worth it. (Happy to write a post-mortem if there's interest.)
- ${audience} don't need more dashboards. They need a single loop that works every time they tap.

I'd love honest feedback. The product link is on my profile (HN rules — no link in post). Specifically interested in:
1. Is the ${proof1} loop actually useful to you day-to-day?
2. Where does it break your workflow?
3. Anything that feels like a 2014 dashboard?

AMA. I'll be in the comments for the next two hours.`;
}

function pickBenefitCopy(p: string): string {
  const map: Record<string, string> = {
    "aggregate workout history": "see every rep, set, and PR together at a glance, in one chart that doesn't lie",
    "weekly streak milestones": "tied to real behaviour, not just app opens, so streaks never feel gamed",
    "video-form coaching cues": "tap-to-play overlays that fix your form without making you read",
    "nudge-based reminders": "scheduled around your calendar, not a 7am spam notification",
    "5-ingredient filter": "stop searching recipes by name, find ones you can actually cook tonight",
    "scan-to-eat labels": "point the camera at any label — allergens called out in plain English",
    "weeknight dinner plans": "auto-built Mon–Thu from what's in your fridge",
    "allergen badges": "kid-recognisable icons, not buried in fine print",
    "one-tap capture": "type it, voice it, or paste it — no modal, no three taps to add a task",
    "AI-summarised action items": "your messy notes become checkboxed steps before you finish your coffee",
    "calendar-aware cron": "tasks live beside your real day, not as a separate list of guilt",
    "macro-tracked progress": "weekly bar of done-not-done, not a guilt dashboard",
    "zero-based budget suggestions": "every dollar earns its place before the month starts",
    "visuals not tabs": "the homepage is a picture of your money, not a spreadsheet",
    "FDIC-style plain language": "we removed every piece of finance jargon. tested with real beginners.",
    "goal thermometers": "fill-up animation that's tied to your actual savings account",
    "active recall prompts": "questions that ask you to retrieve, not re-read",
    "adaptive difficulty": "easier when you're tired, harder when you're streaking",
    "streak XP": "XP that scales with retention, not time spent — no XP farms here",
    "flashcards you actually retain": "the spacing is the algorithm, not a checkbox",
    "mood tags": "tell us how you feel, get a rec that matches — no analysis paralysis",
    "auto-watchlist sync": "adds 'next up' across every platform, kept up to date automatically",
    "social rank lists": "your friend's taste becomes a rec list, not a feed of strangers",
    "AI taste profile": "the more you watch, the more it learns what 'good' means to you",
    "interest-tagged meetups": "show up because of a shared interest, not proximity alone",
    "RSVP accountability": "no-shows cost a 5-star rating, both ways",
    "slow-feed mode": "a feed you have to intentionally refresh — no infinite scroll",
    "verified local anchors": "each city has 2-3 humans vouching for the meetups",
    "instant value on launch": "your first ${pickPlaceholder()} in 60 seconds, not 60 days",
    "share-to-earn hooks": "every friend you bring unlocks a feature you actually wanted",
    "frictionless onboarding": "we removed every screen between install and value",
  };
  return map[p] ?? "designed thoughtfully";
}

function pickPlaceholder(): string {
  return "win";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface CampaignCopy {
  slogan: string;
  strategy: string;
  storeListing: string;
  xThread: string;
  instagramCaption: string;
  launchEmail: string;
  redditAngle: string;
  palette: ColorPalette;
  channels: string[];
}

export function generateRichMockCampaign(
  appName: string,
  category: string,
  audience: string,
  budget = 5000,
): CampaignCopy {
  const seed = generateFNV1aHash(`${appName}|${category}|${audience}`);
  const rng = createMulberry32(seed);
  const brief = CATEGORY_BRIEFS[category] ?? FALLBACK_BRIEF;

  const channels = brief.channels.slice(0, 5);
  const strategy = buildStrategyNarrative(rng, appName, category, audience, budget);
  const slogan = buildSlogan(rng, appName, category, audience);
  const palette = rng.pick(COLOR_PALETTES);

  return {
    slogan,
    strategy,
    storeListing: buildStoreListing(rng, appName, category, audience, slogan),
    xThread: buildXThread(rng, appName, category, audience, slogan),
    instagramCaption: buildInstagramCaption(rng, appName, category, audience, slogan),
    launchEmail: buildLaunchEmail(rng, appName, category, audience, slogan),
    redditAngle: buildRedditAngle(rng, appName, category, audience, slogan),
    palette,
    channels,
  };
}

// ---- Legacy API kept for backward compatibility --------------------

export interface MockCampaignResults {
  strategy: string;
  slogan: string;
  palette: { bg: string; primary: string; secondary: string; accent: string };
}

export function generateSeededMockCampaign(appName: string): MockCampaignResults {
  const seed = generateFNV1aHash(appName || "default");
  const rng = createMulberry32(seed);
  const palette = rng.pick(COLOR_PALETTES);
  return {
    strategy: `test strategy`,
    slogan: `test slogan`,
    palette: { bg: palette.bg, primary: palette.primary, secondary: palette.secondary, accent: palette.accent },
  };
}