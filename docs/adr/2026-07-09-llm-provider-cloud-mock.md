# ADR-002 — LLM Provider: Cloud + Mock (no local model)

**Number**: ADR-002
**Title**: Drop local Ollama as primary; use cloud LLM with deterministic mock fallback
**Date**: 2026-07-09
**Status**: Accepted
**Supersedes**: ADR-001 §3 (LLM provider)

---

## Context

ADR-001 named Ollama (local model) as the primary LLM. The demo host has insufficient
disk space for a multi-GB model download. The offline-demo requirement must still hold.
A local model is therefore impractical as primary.

## Decision

1. **Primary provider = cloud LLM**, used only when (a) an API key env var is present AND
   (b) a network probe to the provider succeeds. Pluggable, OpenAI-compatible endpoint so
   we can use any free-tier provider. Selected by env: `LLM_API_KEY` + `LLM_BASE_URL` +
   `LLM_MODEL`.
2. **Fallback provider = deterministic MockProvider** — always available, zero network,
   zero disk. Returns structured, plausible, varied agent outputs (template + seeded
   variation) and emits simulated tool calls so the orchestration flow is identical to a
   real run. Seeded with FNV-1a hash + Mulberry32 PRNG for reproducibility.
3. **Ollama is dropped** as a required dependency (kept only as a possible future provider
   — not wired now).
4. **Runtime provider selection**: on run start, probe cloud; if unavailable, use Mock.
   UI shows an active-provider badge ("Live LLM" vs "Offline Mock") so the demo is honest
   about which path ran.
5. **Secrets**: key only via env (`LLM_API_KEY`); `.env.example` documents it; `.env` is
   git-ignored.

## Consequences

Positive:

- No multi-GB download — fits the demo host.
- Demo still works fully offline (Mock) → satisfies the offline-demo requirement.
- Real LLM magic when online; graceful degradation when not.
- Free tiers avoid any paid-tier violation.

Negative:

- If Wi-Fi drops mid-demo and there is no key, we run on Mock (acceptable — still demoable).
- Cloud dependency means a real run needs network at demo time (mitigated by Mock fallback
  and a recorded backup video).
- API key must be kept secret (handled via env).

## Alternatives Considered

### Alternative: Browser WebGPU model (transformers.js)
- **Pros**: no server, no key.
- **Cons**: still downloads model weights to cache, low quality at small sizes, flaky in
  hackathon browsers.
- **Rejected**: doesn't solve the space concern cleanly; lower quality than cloud.

### Alternative: Local Ollama (original ADR-001 §3)
- **Rejected**: demo host has no disk space for a multi-GB model.

## Cloud-provider detail

- **Endpoint**: NVIDIA NIM, OpenAI-compatible `/v1/chat/completions` (base URL from
  `LLM_BASE_URL`, default `https://integrate.api.nvidia.com/v1`).
- **Auth**: Bearer `LLM_API_KEY` (env-only).
- **Model**: `LLM_MODEL` env (e.g. `meta/llama-3.1-8b-instruct`). Tool-calling capable
  models only.
- **Runtime selection** honors an optional `forceProvider` parameter (`auto` / `cloud` /
  `mock`) so demo scripts can pin a provider regardless of network state.

## Open Questions

- None blocking. Model name finalized at run time via env.
