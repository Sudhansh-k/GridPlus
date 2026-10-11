import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Database } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { GlassCard } from "@/components/energy";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Model Insights — GridPulse" },
      { name: "description", content: "Compare Linear Regression and Decision Tree accuracy: R², MAE and RMSE." },
      { property: "og:title", content: "Model Insights — GridPulse" },
      { property: "og:description", content: "How accurate are GridPulse's production forecasting models?" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Insights,
});

const LR = { train_r2: 0.6025, test_r2: 0.5649, test_mae: 60.0135, test_rmse: 77.7748 };
const DT = { train_r2: 0.9629, test_r2: 0.8642, test_mae: 28.1392, test_rmse: 43.4489 };
const r2 = [
  { m: "Train R²", LR: LR.train_r2, DT: DT.train_r2 },
  { m: "Test R²", LR: LR.test_r2, DT: DT.test_r2 },
];
const err = [
  { m: "MAE (kW)", LR: LR.test_mae, DT: DT.test_mae },
  { m: "RMSE (kW)", LR: LR.test_rmse, DT: DT.test_rmse },
];
const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 } };

function Chart({ data, title }: { data: typeof r2; title: string }) {
  return (
    <GlassCard>
      <h2 className="mb-3 font-bold">{title}</h2>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeOpacity={0.1} />
            <XAxis dataKey="m" fontSize={12} stroke="var(--muted-foreground)" />
            <YAxis fontSize={12} stroke="var(--muted-foreground)" />
            <Tooltip {...tip} />
            <Legend />
            <Bar dataKey="LR" name="Linear Regression" fill="var(--grid)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="DT" name="Decision Tree" fill="var(--teal)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

function Insights() {
  return (
    <div className="space-y-6">
      <PageHeader title="Model Insights" subtitle="Linear Regression vs Decision Tree" />
      <GlassCard className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr><th className="py-2">Model</th><th>Train R²</th><th>Test R²</th><th>Test MAE</th><th>Test RMSE</th></tr>
          </thead>
          <tbody>
            {[["Linear Regression", LR, "text-grid"], ["Decision Tree", DT, "text-teal"]].map(([n, v, c]) => {
              const m = v as typeof LR;
              return (
                <tr key={n as string} className="border-t">
                  <td className={`py-3 font-bold ${c}`}>{n as string}</td>
                  <td>{m.train_r2.toFixed(4)}</td><td>{m.test_r2.toFixed(4)}</td><td>{m.test_mae.toFixed(2)} kW</td><td>{m.test_rmse.toFixed(2)} kW</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </GlassCard>
      <div className="grid gap-6 lg:grid-cols-2">
        <Chart data={r2} title="R² — higher is better" />
        <Chart data={err} title="Errors — lower is better" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["R² (coefficient of determination)", "Share of variation in production the model explains. 1.0 is perfect; 0 means no better than guessing the average."],
          ["MAE (mean absolute error)", "Average size of the prediction miss, in kW. Easy to read: “off by about 28 kW”."],
          ["RMSE (root mean squared error)", "Like MAE but punishes big misses more. A large gap to MAE means occasional large errors."],
        ].map(([t, d]) => (
          <GlassCard key={t}><h3 className="font-bold">{t}</h3><p className="mt-2 text-sm text-muted-foreground">{d}</p></GlassCard>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard className="border-solar">
          <AlertTriangle className="h-6 w-6 text-solar" />
          <h3 className="mt-3 font-bold">Train/test gap</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The Decision Tree scores 0.96 on training data but 0.86 on unseen test data. That ~0.10 gap hints at some overfitting — it memorises parts of the training set. It still clearly beats Linear Regression on test data, so it's used for dispatch.
          </p>
        </GlassCard>
        <GlassCard>
          <Database className="h-6 w-6 text-battery" />
          <h3 className="mt-3 font-bold">Dataset</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>1,200 rows · 11 columns</li>
            <li>Target: <code className="text-foreground">Energy_Production_kW</code></li>
            <li>Synthetic data — generated for education</li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
