import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowDown, Calculator } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { GlassCard } from "@/components/energy";
import { ACTIONS } from "@/lib/actions";
import type { DispatchAction } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dispatch")({
  head: () => ({
    meta: [
      { title: "Dispatch Logic — GridPulse" },
      { name: "description", content: "How GridPulse decides to charge, discharge, import from grid or raise a shortage alert." },
      { property: "og:title", content: "Dispatch Logic — GridPulse" },
      { property: "og:description", content: "The rules behind GridPulse's dispatch recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dispatch,
});

const RULES: { cond: string; action: DispatchAction }[] = [
  { cond: "balance > 5 kW  AND  SOC < 95%", action: "CHARGE_BATTERY" },
  { cond: "balance < −5 kW  AND  SOC > 20%", action: "DISCHARGE_BATTERY" },
  { cond: "balance < −5 kW  AND  grid available", action: "IMPORT_FROM_GRID" },
  { cond: "balance < −5 kW  AND  grid unavailable", action: "ENERGY_SHORTAGE_ALERT" },
  { cond: "otherwise", action: "BALANCED" },
];

function Dispatch() {
  return (
    <div>
      <PageHeader title="Dispatch Logic" subtitle="Rules are checked top to bottom — the first match wins" />
      <div className="mx-auto max-w-3xl">
        <GlassCard className="flex items-center gap-4 border-teal">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand text-on-accent"><Calculator /></span>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Step 1</p>
            <p className="font-mono text-lg font-bold">balance = predicted production − consumption</p>
          </div>
        </GlassCard>
        {RULES.map((r, i) => {
          const a = ACTIONS[r.action];
          const Icon = a.icon;
          return (
            <motion.div key={r.action} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <ArrowDown className="mx-auto my-2 h-6 w-6 text-muted-foreground" />
              <div className={cn("flex flex-col gap-3 rounded-2xl border-2 p-4 sm:flex-row sm:items-center", a.border, a.soft)}>
                <span className="font-mono text-sm sm:flex-1">
                  <span className="mr-2 text-muted-foreground">{i === RULES.length - 1 ? "else" : i === 0 ? "if" : "else if"}</span>
                  {r.cond}
                </span>
                <span className={cn("inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-on-accent", a.bg, r.action === "ENERGY_SHORTAGE_ALERT" && "animate-pulse")}>
                  <Icon className="h-4 w-4" /> {r.action}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
