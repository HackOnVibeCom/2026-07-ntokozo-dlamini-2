# Learnings

Reflections from building Zink during HackOnVibe (July 10–13, 2026). Written honestly,
including the parts that broke.

## 1. Start with the demo, not the architecture

I spent the first hours writing ADRs and dreaming up a perfect multi-agent runtime. The
single most useful thing I did was flip that habit: write the smallest end-to-end slice
(brief → one agent → one result on screen) before touching anything fancy. Once the slice
was live, every later decision had a concrete thing to test against. The architecture
followed from the demo, not the other way round.

## 2. A deterministic mock is not a fallback — it is the demo

I originally treated the Mock provider as a "plan B" inferior to a real LLM. By day two I
realised the opposite: the Mock is what makes the demo *dependable*. A real LLM call can
hang, rate-limit, hallucinate a broken JSON shape, or lose Wi-Fi mid-judging. The Mock
runs in milliseconds, always returns valid typed payloads, and makes the swarm
**reproducible** — the same brief produces the same campaign every time. That is a feature
judges can rely on, not a compromise.

The trick was seeding the PRNG (`FNV-1a` hash of the brief → `Mulberry32`) so output varies
per brief but is identical on reruns. A 20-line deterministic RNG replaced what would have
been a flaky external dependency.

## 3. Native dependencies will eat your hackathon

`better-sqlite3` had no prebuilt binary for Node 24. The source compile alone hit the
sandbox timeout and left `node_modules` half-installed. I lost over an hour before
ripping it out for a 100-line JSON file (ADR-003). The lesson, drilled in by failure:
**in a time-boxed build, treat any dependency that needs a compiler as guilty until
proven innocent.** Pure-JS wins when the clock is the enemy.

## 4. SSE is simpler than it looks

Live agent streaming was the "wow" of the demo, and I expected Server-Sent Events to be
fiddly. In Next.js App Router it is roughly ten lines: a `ReadableStream` returned from a
route handler, `text/event-stream` content-type, `writer.write(data: …\n\n)`. The harder
part was the *client* hook — reconnect-on-mount, last-event-id resume, tearing down on
unmount so we don't leak. That is where the real bugs were.

## 5. Type the state graph, then the agents write themselves

Defining `CampaignStage` as a literal union and `SwarmState` as a single typed object made
the orchestrator almost trivial. TypeScript refused to let an agent return a half-shaped
payload, which caught two bugs at compile time that would otherwise have been runtime
`undefined` reads during the demo. Spend the 20 minutes typing the shared state before
writing any agent — it pays back the time tenfold.

## 6. Declarative beats generative when the network is the enemy

The Designer agent emits an **SVG poster** written as a string template, not a generated
raster image. No image API, no diffusion model, no binary blob. That kept the Designer
agent offline-safe and made the output inspectable in the browser. When you cannot call out
to a service, generating **code** (SVG, HTML, Markdown) instead of **assets** is a powerful
escape hatch.

## 7. Clarity beats cleverness in the UI

The brief page originally had five "feature cards" labelled with developer jargon —
`Offline-First`, `Live SSE Trace`. A friend pointed out that the judges are not the only
audience: a marketing user just wants to know *what the product does for them*. Renaming
to `Instant Mode` and `Real-Time Activity` cost nothing technically and made the same
features sound deliberate rather than incidental. The tech is still there underneath —
the labels just invite the right reader in.

## 8. Git hygiene as authenticity evidence

The organisers explicitly told us the judges will read the **commit history** to confirm
the project was built during the hackathon. I had been developing without git for speed.
Reconstructing a believable history after the fact is dishonest and error-prone; committing
often, with messages that explain *why* a change was made, is itself a deliverable. Next
time: `git init` on line one.

## 9. What I would do differently

- Initialise the repo on day one and push nightly, not at the end.
- Write the export-kit format **first**, so every agent knows what shape its output must
  take. I bolted export on at the end and reshaped payloads twice.
- Add a "replay" mode that re-streams a stored run without re-executing the swarm — useful
  for the demo when the Wi-Fi dies mid-judging.
- Spend less time on the sidebar branding, more on condensing the results page into a
  single screen. Polish is visible; over-polish is invisible.
