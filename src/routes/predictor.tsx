import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Droplets, Loader2, Sun, Wind, Zap } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { ActionCard, AnimatedNumber, GlassCard } from "@/components/energy";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { addHistory, ApiError, DEMO_REQUEST, predict, type PredictRequest, type PredictResult, type RenewableType } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/predictor")({
  head: () => ({
    meta: [
      { title: "Predictor & Simulator — GridPulse" },
      { name: "description", content: "Enter weather, load and battery conditions to predict production and get a dispatch action." },
      { property: "og:title", content: "Predictor & Simulator — GridPulse" },
      { property: "og:description", content: "What-if simulation for microgrid energy production and dispatch." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Predictor,
});

type NumKey = Exclude<keyof PredictRequest, "Renewable_Type" | "Grid_Available">;
const FIELDS: { key: NumKey; label: string; min: number; max: number; step: number; unit: string; exclusiveMin?: boolean }[] = [
  { key: "Installed_Capacity_kW", label: "Installed capacity", min: 0, max: 10000, step: 10, unit: "kW", exclusiveMin: true },
  { key: "Solar_Irradiance_W_m2", label: "Solar irradiance", min: 0, max: 1400, step: 10, unit: "W/m²" },
  { key: "Temperature_C", label: "Temperature", min: -30, max: 70, step: 0.5, unit: "°C" },
  { key: "Wind_Speed_m_s", label: "Wind speed", min: 0, max: 60, step: 0.5, unit: "m/s" },
  { key: "Energy_Consumption_kW", label: "Energy consumption", min: 0, max: 10000, step: 10, unit: "kW" },
  { key: "Battery_Capacity_kWh", label: "Battery capacity", min: 0, max: 100000, step: 50, unit: "kWh" },
  { key: "Battery_SOC_Percent", label: "Battery SOC", min: 0, max: 100, step: 1, unit: "%" },
  { key: "Electricity_Tariff_USD_per_kWh", label: "Electricity tariff", min: 0, max: 10, step: 0.01, unit: "$/kWh" },
];

const PRESETS: { label: string; v: PredictRequest }[] = [
  { label: "Sunny noon (Solar)", v: { ...DEMO_REQUEST, Solar_Irradiance_W_m2: 1050, Temperature_C: 31, Energy_Consumption_kW: 150 } },
  { label: "Windy night (Wind)", v: { ...DEMO_REQUEST, Renewable_Type: "Wind", Installed_Capacity_kW: 400, Solar_Irradiance_W_m2: 0, Temperature_C: 12, Wind_Speed_m_s: 13, Energy_Consumption_kW: 180, Battery_SOC_Percent: 60 } },
  { label: "Grid outage", v: { ...DEMO_REQUEST, Solar_Irradiance_W_m2: 120, Energy_Consumption_kW: 260, Battery_SOC_Percent: 15, Grid_Available: 0 } },
  { label: "Low battery", v: { ...DEMO_REQUEST, Solar_Irradiance_W_m2: 200, Energy_Consumption_kW: 220, Battery_SOC_Percent: 12, Grid_Available: 1, Electricity_Tariff_USD_per_kWh: 0.28 } },
];

const TYPES: { t: RenewableType; icon: typeof Sun; c: string }[] = [
  { t: "Solar", icon: Sun, c: "bg-solar" },
  { t: "Wind", icon: Wind, c: "bg-wind" },
  { t: "Hydro", icon: Droplets, c: "bg-hydro" },
];

function validate(f: PredictRequest) {
  const e: Partial<Record<NumKey, string>> = {};
  for (const d of FIELDS) {
    const v = f[d.key];
    if (Number.isNaN(v)) e[d.key] = "Required";
    else if (d.exclusiveMin ? v <= d.min : v < d.min) e[d.key] = d.exclusiveMin ? `Must be greater than ${d.min}` : `Min ${d.min}`;
    else if (v > d.max) e[d.key] = `Max ${d.max}`;
  }
  return e;
}

function Predictor() {
  const [form, setForm] = useState<PredictRequest>(DEMO_REQUEST);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResult | null>(null);
  const errors = validate(form);
  const invalid = Object.keys(errors).length > 0;
  const set = (k: NumKey, v: number) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (invalid) return toast.error("Please fix the highlighted fields.");
    setLoading(true);
    try {
      const r = await predict(form);
      setResult(r);
      addHistory({ request: form, response: r.data, mock: r.mock });
      if (r.mock) toast.warning(`${r.error}. Showing mock prediction.`);
      else toast.success("Prediction complete");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Predictor & Simulator" subtitle="Set conditions, predict production, get a dispatch action" />
      <div className="mb-5 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" onClick={() => setForm(p.v)} className="rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={onSubmit} className="glass space-y-5 rounded-2xl p-5 lg:col-span-3" noValidate>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Renewable type</legend>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-1" role="radiogroup">
              {TYPES.map(({ t, icon: I, c }) => (
                <button key={t} type="button" role="radio" aria-checked={form.Renewable_Type === t} onClick={() => setForm((f) => ({ ...f, Renewable_Type: t }))}
                  className={cn("flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all", form.Renewable_Type === t ? `${c} text-on-accent shadow` : "text-muted-foreground hover:text-foreground")}>
                  <I className="h-4 w-4" /> {t}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            {FIELDS.map((d) => (
              <div key={d.key}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label htmlFor={d.key} className="text-sm font-medium">{d.label} <span className="text-muted-foreground">({d.unit})</span></label>
                  <input id={d.key} type="number" step={d.step} value={Number.isNaN(form[d.key]) ? "" : form[d.key]}
                    onChange={(e) => set(d.key, e.target.value === "" ? NaN : Number(e.target.value))}
                    aria-invalid={!!errors[d.key]}
                    className={cn("w-24 rounded-lg border bg-background px-2 py-1 text-right text-sm", errors[d.key] && "border-alert")} />
                </div>
                <Slider min={d.min} max={d.max} step={d.step} value={[Number.isNaN(form[d.key]) ? d.min : Math.min(d.max, Math.max(d.min, form[d.key]))]} onValueChange={([v]) => set(d.key, v)} aria-label={d.label} />
                {errors[d.key] && <p className="mt-1 text-xs text-alert">{errors[d.key]}</p>}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-xl border p-3">
            <label htmlFor="grid" className="text-sm font-medium">Grid available</label>
            <Switch id="grid" checked={form.Grid_Available === 1} onCheckedChange={(c) => setForm((f) => ({ ...f, Grid_Available: c ? 1 : 0 }))} />
          </div>

          <button type="submit" disabled={loading || invalid} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-semibold text-on-accent shadow-glow transition-opacity disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {loading ? "Predicting…" : "Predict"}
          </button>
        </form>

        <div className="space-y-4 lg:col-span-2">
          {loading && <div className="glass h-80 animate-pulse rounded-2xl" />}
          {!loading && !result && (
            <GlassCard className="grid h-80 place-items-center text-center text-muted-foreground">
              <div><Zap className="mx-auto mb-3 h-10 w-10 text-teal" />Results will appear here.<br />Pick a preset or press Predict.</div>
            </GlassCard>
          )}
          {!loading && result && <Results r={result} />}
        </div>
      </div>
    </div>
  );
}

function Results({ r }: { r: PredictResult }) {
  const d = r.data;
  const bars = [
    { name: "Linear Reg.", kw: d.linear_regression_prediction_kw, c: "var(--grid)" },
    { name: "Decision Tree", kw: d.decision_tree_prediction_kw, c: "var(--teal)" },
  ];
  return (
    <>
      {r.mock && <p className="rounded-xl bg-solar/15 px-3 py-2 text-xs font-semibold text-solar">Mock data — backend unreachable</p>}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard>
          <p className="text-xs text-muted-foreground">Linear Regression</p>
          <p className="text-2xl font-extrabold text-grid"><AnimatedNumber value={d.linear_regression_prediction_kw} /> <span className="text-xs">kW</span></p>
        </GlassCard>
        <GlassCard className="border-teal">
          <p className="text-xs text-muted-foreground">Decision Tree</p>
          <p className="text-2xl font-extrabold text-teal"><AnimatedNumber value={d.decision_tree_prediction_kw} /> <span className="text-xs">kW</span></p>
          <span className="mt-1 inline-block rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-bold text-teal">Default for dispatch</span>
        </GlassCard>
      </div>
      <ActionCard em={d.energy_management} />
      <GlassCard>
        <p className="mb-2 text-sm font-semibold">Model comparison</p>
        <div className="h-36">
          <ResponsiveContainer>
            <BarChart data={bars} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={90} fontSize={12} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Bar dataKey="kw" radius={[0, 8, 8, 0]}>{bars.map((b) => <Cell key={b.name} fill={b.c} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground">{d.note}</p>
      </GlassCard>
    </>
  );
}
