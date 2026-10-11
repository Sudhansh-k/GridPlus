import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { PageHeader, ThemeToggle } from "@/components/AppShell";
import { GlassCard } from "@/components/energy";
import { checkHealth, DEFAULT_API, getApiBase, setApiBase } from "@/lib/api";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About & Settings — GridPulse" },
      { name: "description", content: "About the GridPulse project, its tech stack, and backend connection settings." },
      { property: "og:title", content: "About & Settings — GridPulse" },
      { property: "og:description", content: "Project info and API settings for GridPulse." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

const STACK = ["React 19", "TypeScript", "Tailwind CSS", "shadcn/ui", "Recharts", "Framer Motion", "TanStack Router", "FastAPI backend", "scikit-learn"];

function About() {
  const [url, setUrl] = useState(DEFAULT_API);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  useEffect(() => setUrl(getApiBase()), []);

  async function test() {
    setStatus("loading");
    const ok = await checkHealth(url.replace(/\/+$/, ""));
    setStatus(ok ? "ok" : "fail");
    ok ? toast.success("Backend is reachable") : toast.error("Could not reach /health");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="About & Settings" />
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h2 className="text-lg font-bold">About GridPulse</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            GridPulse is an autonomous microgrid energy management demo. Two ML models forecast renewable production from weather and capacity, and a rule engine turns that forecast into a battery/grid dispatch action.
          </p>
          <h3 className="mt-5 text-sm font-semibold">Tech stack</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {STACK.map((s) => <span key={s} className="rounded-full border bg-muted px-3 py-1 text-xs">{s}</span>)}
          </div>
          <div className="mt-5 flex gap-3 rounded-xl bg-alert/10 p-3 text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0 text-alert" />
            Educational demo using synthetic data. Not for controlling real electrical equipment.
          </div>
        </GlassCard>

        <GlassCard className="space-y-5">
          <h2 className="text-lg font-bold">Settings</h2>
          <div>
            <label htmlFor="api" className="text-sm font-medium">API base URL</label>
            <div className="mt-2 flex gap-2">
              <input id="api" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm" />
              <button onClick={() => { setApiBase(url || DEFAULT_API); toast.success("Saved"); }} className="rounded-xl bg-brand px-4 text-sm font-semibold text-on-accent">Save</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={test} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-accent">
              {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />} Test connection
            </button>
            {status === "ok" && <span className="flex items-center gap-1 text-sm font-semibold text-surplus"><CheckCircle2 className="h-4 w-4" /> Connected</span>}
            {status === "fail" && <span className="flex items-center gap-1 text-sm font-semibold text-alert"><XCircle className="h-4 w-4" /> Unreachable</span>}
          </div>
          <div className="flex items-center justify-between rounded-xl border p-3">
            <span className="text-sm font-medium">Theme</span>
            <ThemeToggle />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
