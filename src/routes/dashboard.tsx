import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DollarSign, Plug, Sun, Trash2, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { ActionCard, AnimatedNumber, EnergyFlow, GlassCard, SocGauge } from "@/components/energy";
import { DEMO_REQUEST, clearHistory, getHistory, mockPredict, type HistoryEntry } from "@/lib/api";
import { ACTIONS } from "@/lib/actions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — GridPulse" },
      { name: "description", content: "Live microgrid KPIs, energy flow, charts and recommended dispatch action." },
      { property: "og:title", content: "Dashboard — GridPulse" },
      { property: "og:description", content: "Live microgrid KPIs, energy flow and dispatch recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const series = Array.from({ length: 24 }, (_, h) => {
  return {
    hour: `${h}:00`,
    soc: Math.round(Math.min(98, Math.max(18, 45 + Math.sin(((h - 10) / 24) * 2 * Math.PI) * 35))),
    tariff: +(0.1 + (h >= 17 && h <= 21 ? 0.12 : 0) + (h >= 7 && h <= 10 ? 0.05 : 0)).toFixed(2),
  };
});
const mix = [
  { name: "Solar", value: 55, color: "var(--solar)" },
  { name: "Wind", value: 30, color: "var(--wind)" },
  { name: "Hydro", value: 15, color: "var(--hydro)" },
];
const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" } };

function Dashboard() {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  useEffect(() => setHistory(getHistory()), []);
  const latest = history?.[0];
  const demo = !latest;
  const req = latest?.request ?? DEMO_REQUEST;
  const res = useMemo(() => latest?.response ?? mockPredict(DEMO_REQUEST), [latest]);
  const prod = res.decision_tree_prediction_kw;
  const net = res.energy_management.predicted_surplus_kw;
  const runs = (history ?? []).slice().reverse().map((h, i) => ({
    run: `#${i + 1} ${new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    production: +h.response.decision_tree_prediction_kw.toFixed(1),
    consumption: h.request.Energy_Consumption_kW,
  }));

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Real-time view of your microgrid">
        {demo && <span className="rounded-full bg-solar/20 px-3 py-1 text-xs font-semibold text-solar">Demo data</span>}
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={Sun} label="Predicted production" color="text-solar" value={prod} unit="kW" />
        <Kpi icon={Zap} label="Consumption" color="text-teal" value={req.Energy_Consumption_kW} unit="kW" />
        <Kpi icon={net >= 0 ? TrendingUp : TrendingDown} label="Net surplus" color={net >= 0 ? "text-surplus" : "text-alert"} value={net} unit="kW" />
        <GlassCard className="flex items-center gap-3">
          <div className="relative">
            <SocGauge value={req.Battery_SOC_Percent} />
            <span className="absolute inset-0 grid place-items-center text-sm font-bold">{req.Battery_SOC_Percent}%</span>
          </div>
          <span className="text-xs text-muted-foreground">Battery SOC</span>
        </GlassCard>
        <GlassCard>
          <Plug className="h-5 w-5 text-grid" />
          <p className="mt-3 text-xs text-muted-foreground">Grid status</p>
          <span className={cn("mt-1 inline-block rounded-full px-3 py-1 text-sm font-bold", req.Grid_Available ? "bg-surplus/20 text-surplus" : "bg-alert/20 text-alert")}>
            {req.Grid_Available ? "Online" : "Offline"}
          </span>
        </GlassCard>
        <Kpi icon={DollarSign} label="Current tariff" color="text-solar" value={req.Electricity_Tariff_USD_per_kWh} unit="$/kWh" decimals={2} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <GlassCard className="lg:col-span-3">
          <h2 className="mb-2 font-bold">Energy flow</h2>
          <EnergyFlow production={prod} consumption={req.Energy_Consumption_kW} action={res.energy_management.recommended_action} source={req.Renewable_Type} />
        </GlassCard>
        <div className="lg:col-span-2">
          <ActionCard em={res.energy_management} large />
          <Link to="/predictor" className="mt-4 inline-flex w-full justify-center rounded-xl bg-brand px-4 py-3 font-semibold text-on-accent">
            Run a new prediction
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Recent predictions — production vs consumption (kW)">
          {runs.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
              <p>No runs yet. <Link to="/predictor" className="font-semibold text-primary underline">Run a prediction</Link> to see this chart.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={runs}>
                <defs>
                  <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--solar)" stopOpacity={0.6} /><stop offset="100%" stopColor="var(--solar)" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--teal)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--teal)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeOpacity={0.1} />
                <XAxis dataKey="run" fontSize={10} stroke="var(--muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip {...tip} />
                <Legend />
                <Area dataKey="production" name="Predicted production" stroke="var(--solar)" fill="url(#gp)" strokeWidth={2} dot />
                <Area dataKey="consumption" name="Consumption" stroke="var(--teal)" fill="url(#gc)" strokeWidth={2} dot />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Battery SOC (%)" illustrative>
          <LineChart data={series}>
            <CartesianGrid strokeOpacity={0.1} />
            <XAxis dataKey="hour" fontSize={11} stroke="var(--muted-foreground)" />
            <YAxis domain={[0, 100]} fontSize={11} stroke="var(--muted-foreground)" />
            <Tooltip {...tip} />
            <Line dataKey="soc" stroke="var(--battery)" strokeWidth={3} dot={false} />
          </LineChart>
        </ChartCard>
        <ChartCard title="Energy mix" illustrative>
          <PieChart>
            <Tooltip {...tip} />
            <Pie data={mix} dataKey="value" innerRadius={60} outerRadius={95} paddingAngle={4}>
              {mix.map((m) => <Cell key={m.name} fill={m.color} stroke="none" />)}
            </Pie>
          </PieChart>
        </ChartCard>
        <ChartCard title="Tariff trend ($/kWh)" illustrative>
          <BarChart data={series}>
            <CartesianGrid strokeOpacity={0.1} />
            <XAxis dataKey="hour" fontSize={11} stroke="var(--muted-foreground)" />
            <YAxis fontSize={11} stroke="var(--muted-foreground)" />
            <Tooltip {...tip} />
            <Bar dataKey="tariff" fill="var(--grid)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      <GlassCard className="mt-6 overflow-x-auto">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-bold">Recent predictions</h2>
          {history && history.length > 0 && (
            <button
              type="button"
              onClick={() => { clearHistory(); setHistory([]); toast.success("Prediction history cleared"); }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-alert hover:text-alert"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear history
            </button>
          )}
        </div>
        {history && history.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No predictions yet. <Link to="/predictor" className="font-semibold text-primary underline">Run your first one</Link>.
          </p>
        )}
        {history && history.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr><th className="py-2">Time</th><th>Source</th><th>DT kW</th><th>LR kW</th><th>Surplus</th><th>Action</th></tr>
            </thead>
            <tbody>
              {history.map((h) => {
                const a = ACTIONS[h.response.energy_management.recommended_action];
                return (
                  <tr key={h.id} className="border-t">
                    <td className="py-2">{new Date(h.at).toLocaleTimeString()}{h.mock && <span className="ml-1 text-[10px] text-solar">mock</span>}</td>
                    <td>{h.request.Renewable_Type}</td>
                    <td>{h.response.decision_tree_prediction_kw.toFixed(1)}</td>
                    <td>{h.response.linear_regression_prediction_kw.toFixed(1)}</td>
                    <td className={h.response.energy_management.predicted_surplus_kw >= 0 ? "text-surplus" : "text-alert"}>{h.response.energy_management.predicted_surplus_kw.toFixed(1)}</td>
                    <td><span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", a.soft, a.text)}>{a.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </GlassCard>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, unit, color, decimals = 1 }: { icon: typeof Sun; label: string; value: number; unit: string; color: string; decimals?: number }) {
  return (
    <GlassCard className="lift">
      <Icon className={cn("h-5 w-5", color)} />
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-extrabold", color)}>
        <AnimatedNumber value={value} decimals={decimals} /> <span className="text-xs font-medium text-muted-foreground">{unit}</span>
      </p>
    </GlassCard>
  );
}

function ChartCard({ title, children, illustrative }: { title: string; children: React.ReactElement; illustrative?: boolean }) {
  return (
    <GlassCard>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-bold">{title}</h2>
        {illustrative && <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Illustrative data</span>}
      </div>
      <div className="h-64">
        {illustrative ? <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer> : children}
      </div>
    </GlassCard>
  );
}
