import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, GitBranch, LineChart, SlidersHorizontal, Sparkles } from "lucide-react";
import { EnergyFlow, GlassCard } from "@/components/energy";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GridPulse — Predict. Balance. Power." },
      { name: "description", content: "AI-driven microgrid energy management: forecast renewable production and get smart dispatch actions." },
      { property: "og:title", content: "GridPulse — Predict. Balance. Power." },
      { property: "og:description", content: "Forecast renewable production and get smart dispatch recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const FEATURES = [
  { icon: LineChart, title: "ML production forecasting", text: "Linear Regression and Decision Tree models predict kW output from weather and capacity.", color: "text-solar" },
  { icon: GitBranch, title: "Smart dispatch", text: "Rule-based recommendations to charge, discharge, import or alert.", color: "text-surplus" },
  { icon: BrainCircuit, title: "Model comparison", text: "Side-by-side R², MAE and RMSE so you know which model to trust.", color: "text-battery" },
  { icon: SlidersHorizontal, title: "What-if simulation", text: "Drag sliders, load presets, and see how the grid reacts.", color: "text-grid" },
];

const STATS = [
  ["0.86", "Decision Tree test R²"],
  ["28.1 kW", "Test MAE"],
  ["1,200", "Training samples"],
  ["2", "ML models"],
];

function Home() {
  return (
    <div className="space-y-20">
      <section className="relative grid items-center gap-10 pt-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-solar" /> Autonomous microgrid EMS
          </span>
          <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
            <span className="text-brand">Predict.</span> Balance. Power.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            GridPulse uses machine learning to forecast solar, wind and hydro output, then recommends exactly what your battery and grid connection should do next.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-on-accent shadow-glow transition-transform hover:-translate-y-0.5">
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/predictor" className="inline-flex items-center gap-2 rounded-xl border bg-card px-6 py-3 font-semibold transition-colors hover:bg-accent">
              Try the Predictor
            </Link>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }}>
          <GlassCard className="p-6 shadow-glow">
            <EnergyFlow production={200} consumption={140} action="CHARGE_BATTERY" />
          </GlassCard>
        </motion.div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map(([v, l]) => (
          <GlassCard key={l} className="text-center">
            <p className="text-3xl font-extrabold text-brand">{v}</p>
            <p className="mt-1 text-xs text-muted-foreground">{l}</p>
          </GlassCard>
        ))}
      </section>

      <section>
        <h2 className="mb-6 text-3xl font-extrabold tracking-tight">Everything a microgrid needs</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <GlassCard className="lift h-full">
                <f.icon className={`h-8 w-8 ${f.color}`} />
                <h3 className="mt-4 font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-3xl font-extrabold tracking-tight">How it works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {["Enter conditions", "Models predict production", "Get dispatch action"].map((s, i) => (
            <GlassCard key={s} className="relative">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand font-extrabold text-on-accent">{i + 1}</span>
              <h3 className="mt-4 text-lg font-bold">{s}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {[
                  "Choose a source, set weather, load, battery and grid status.",
                  "Two regression models estimate energy production in kW.",
                  "Dispatch rules compare supply and demand and tell you what to do.",
                ][i]}
              </p>
            </GlassCard>
          ))}
        </div>
      </section>

      <footer className="border-t pt-6 text-center text-sm text-muted-foreground">
        Educational demo using synthetic data. Not for controlling real electrical equipment.
      </footer>
    </div>
  );
}
