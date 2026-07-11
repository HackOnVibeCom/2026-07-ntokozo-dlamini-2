"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { APP_CATEGORIES, getAudienceSuggestions } from "@/lib/categories";

export default function BriefPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    appName: "",
    targetAudience: "",
    category: "",
    storeUrl: "",
    marketingBudget: "5000",
    designShare: "0.25",
    forceProvider: "auto",
  });
  const [error, setError] = useState<string | null>(null);

  // Autocomplete state for target audience
  const [audienceSuggestions, setAudienceSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleCategoryChange(value: string) {
    setForm((f) => ({ ...f, category: value }));
    const sugg = getAudienceSuggestions(value);
    setAudienceSuggestions(sugg);
  }

  function handleAudienceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setForm((f) => ({ ...f, targetAudience: value }));
    const sugg = getAudienceSuggestions(form.category);
    if (value.length > 0 && sugg.length > 0) {
      const filtered = sugg.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      );
      setAudienceSuggestions(filtered);
      setShowSuggestions(true);
    } else if (value.length === 0 && sugg.length > 0) {
      setAudienceSuggestions(sugg);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
    setActiveSuggestion(-1);
  }

  function handleAudienceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || audienceSuggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((i) => (i + 1) % audienceSuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((i) => (i <= 0 ? audienceSuggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeSuggestion >= 0) {
      e.preventDefault();
      setForm((f) => ({ ...f, targetAudience: audienceSuggestions[activeSuggestion] }));
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  }

  function pickSuggestion(s: string) {
    setForm((f) => ({ ...f, targetAudience: s }));
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    inputRef.current?.focus();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/swarm/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start swarm");
      router.push(`/swarm/${data.runId}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">New Launch Brief</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Configure your app and let a 5-agent swarm plan, write, design, and project your launch campaign.
          </p>
        </div>

        <form onSubmit={submit}>
          <Card>
            <CardHeader>
              <CardTitle>App Details</CardTitle>
              <CardDescription>Your app&apos;s identity and target market.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">App Name</label>
                  <Input value={form.appName} onChange={set("appName")} placeholder="VeloTrack" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Category</label>
                  <Select value={form.category} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category…" />
                    </SelectTrigger>
                    <SelectContent>
                      {APP_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!form.category && (
                    <p className="text-[11px] text-rose-500">Please select a category.</p>
                  )}
                </div>
              </div>
              <div className="relative space-y-2">
                <label className="text-sm font-medium text-zinc-700">Target Audience</label>
                <Input
                  ref={inputRef}
                  value={form.targetAudience}
                  onChange={handleAudienceChange}
                  onKeyDown={handleAudienceKeyDown}
                  onFocus={() => {
                    if (form.category && audienceSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder={form.category ? "Type or pick an audience…" : "Select a category first"}
                  required
                />
                {showSuggestions && audienceSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
                    {audienceSuggestions.map((s, i) => (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          pickSuggestion(s);
                        }}
                        onMouseEnter={() => setActiveSuggestion(i)}
                        className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                          i === activeSuggestion
                            ? "bg-zinc-100 text-zinc-900"
                            : "text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {form.category && audienceSuggestions.length > 0 && !form.targetAudience && (
                  <p className="text-[11px] text-zinc-400">
                    {audienceSuggestions.length} suggestions for {form.category}. Start typing to filter.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Store URL</label>
                <Input value={form.storeUrl} onChange={set("storeUrl")} placeholder="https://apps.apple.com/..." />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Budget & Allocation</CardTitle>
              <CardDescription>Campaign budget and design investment split.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Marketing Budget (USD)</label>
                  <Input type="number" value={form.marketingBudget} onChange={set("marketingBudget")} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Design Share (0–1)</label>
                  <Input type="number" step="0.05" min="0" max="1" value={form.designShare} onChange={set("designShare")} required />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Provider Mode
                <Badge variant="secondary">Demo</Badge>
              </CardTitle>
              <CardDescription>Control whether the agents use cloud LLMs or run offline.</CardDescription>
            </CardHeader>
            <CardContent>
              <select
                className="flex h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                value={form.forceProvider}
                onChange={set("forceProvider")}
              >
                <option value="auto">Auto — cloud if key+network, else mock</option>
                <option value="cloud">Force cloud — NVIDIA NIM</option>
                <option value="mock">Force offline mock</option>
              </select>
              <p className="mt-2 text-xs text-zinc-400">
                Auto uses NVIDIA NIM when LLM_API_KEY is configured and reachable. Mock mode works fully offline with no network dependency.
              </p>
            </CardContent>
          </Card>

          {error && (
            <Card className="mt-4 border-rose-200 bg-rose-50">
              <CardContent className="py-3">
                <p className="text-sm text-rose-600">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card className="mt-4">
            <CardFooter className="border-0 pt-0">
              <Button type="submit" disabled={busy || !form.category} isLoading={busy} className="w-full" size="lg">
                {busy ? "Launching swarm…" : "Launch the Swarm →"}
              </Button>
            </CardFooter>
          </Card>
        </form>

        {/* Bento grid feature showcase */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">5-Agent Swarm</CardTitle>
              <CardDescription>Strategist · Copywriter · Designer · Analyst · Orchestrator</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Instant Mode</CardTitle>
              <CardDescription>Hybrid execution: cloud LLM when online, deterministic local mock instantly — zero wait, zero config.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Real-Time Activity</CardTitle>
              <CardDescription>Watch the swarm think live — every agent decision, tool call, and handoff streamed to your dashboard.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}