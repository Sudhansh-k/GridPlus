import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import { Battery, Droplets, Home, Plug, Sun, Wind } from "lucide-react";
import type { EnergyManagement } from "@/lib/api";
import { ACTIONS } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function AnimatedNumber({ value, decimals = 1 }: { value: number; decimals?: number }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => v.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals }));
  useEffect(() => {
    const c = animate(mv, value, { duration: 1, ease: "easeOut" });
    return c.stop;
  }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}

export function GlassCard({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass rounded-2xl p-5", className)} {...p}>
      {children}
    </div>
  );
}

export function ActionCard({ em, large }: { em: EnergyManagement; large?: boolean }) {
  const a = ACTIONS[em.recommended_action];
  const Icon = a.icon;
  const alert = em.recommended_action === "ENERGY_SHORTAGE_ALERT";
  return (
    <motion.div
      key={em.recommended_action}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("relative overflow-hidden rounded-2xl border-2 p-5", a.border, a.soft)}
    >
      <div className="flex items-start gap-4">
        <span className={cn("grid shrink-0 place-items-center rounded-2xl text-on-accent", a.bg, large ? "h-16 w-16" : "h-12 w-12", alert && "animate-pulse")}>
          <Icon className={large ? "h-8 w-8" : "h-6 w-6"} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recommended action</p>
          <p className={cn("font-extrabold", a.text, large ? "text-2xl md:text-3xl" : "text-xl")}>{a.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{em.reason}</p>
          <p className="mt-3 text-sm">
            Predicted surplus:{" "}
            <span className={cn("font-bold", em.predicted_surplus_kw >= 0 ? "text-surplus" : "text-alert")}>
              {em.predicted_surplus_kw >= 0 ? "+" : ""}
              {em.predicted_surplus_kw.toFixed(1)} kW
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

type Node = { x: number; y: number; label: string; icon: typeof Sun; color: string };

/** Animated microgrid diagram. Arrow widths/directions react to inputs. */
export function EnergyFlow({
  production = 180,
  consumption = 140,
  action = "CHARGE_BATTERY",
  compact,
}: {
  production?: number;
  consumption?: number;
  action?: EnergyManagement["recommended_action"];
  compact?: boolean;
}) {
  const nodes: Record<string, Node> = {
    solar: { x: 60, y: 50, label: "Solar", icon: Sun, color: "var(--solar)" },
    wind: { x: 60, y: 150, label: "Wind", icon: Wind, color: "var(--wind)" },
    hydro: { x: 60, y: 250, label: "Hydro", icon: Droplets, color: "var(--hydro)" },
    battery: { x: 250, y: 150, label: "Battery", icon: Battery, color: "var(--battery)" },
    load: { x: 440, y: 90, label: "Load", icon: Home, color: "var(--teal)" },
    grid: { x: 440, y: 230, label: "Grid", icon: Plug, color: "var(--grid)" },
  };
  const w = (kw: number) => Math.max(1.5, Math.min(8, kw / 40));
  const charging = action === "CHARGE_BATTERY";
  const discharging = action === "DISCHARGE_BATTERY";
  const importing = action === "IMPORT_FROM_GRID";
  const shortage = action === "ENERGY_SHORTAGE_ALERT";

  const edges: { from: string; to: string; width: number; color: string; active: boolean }[] = [
    { from: "solar", to: "battery", width: w(production * 0.5), color: "var(--solar)", active: true },
    { from: "wind", to: "battery", width: w(production * 0.3), color: "var(--wind)", active: true },
    { from: "hydro", to: "battery", width: w(production * 0.2), color: "var(--hydro)", active: true },
    {
      from: "battery",
      to: "load",
      width: w(consumption),
      color: shortage ? "var(--alert)" : "var(--teal)",
      active: true,
    },
    importing
      ? { from: "grid", to: "battery", width: w(Math.abs(production - consumption)), color: "var(--grid)", active: true }
      : { from: "battery", to: "grid", width: 2, color: "var(--grid)", active: false },
  ];

  return (
    <svg viewBox="0 0 500 300" className={cn("w-full", compact ? "max-h-64" : "max-h-80")} role="img" aria-label="Energy flow diagram">
      {edges.map((e, i) => {
        const a = nodes[e.from];
        const b = nodes[e.to];
        const mx = (a.x + b.x) / 2;
        const d = `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
        return (
          <g key={i}>
            <path d={d} stroke={e.color} strokeOpacity={0.15} strokeWidth={e.width + 4} fill="none" />
            <path d={d} stroke={e.color} strokeWidth={e.width} fill="none" strokeLinecap="round" className={e.active ? "flow-dash" : ""} strokeOpacity={e.active ? 1 : 0.25} />
          </g>
        );
      })}
      {Object.entries(nodes).map(([k, n]) => {
        const Icon = n.icon;
        const glow = (k === "battery" && (charging || discharging)) || (k === "grid" && importing);
        return (
          <g key={k} transform={`translate(${n.x - 26},${n.y - 26})`}>
            <rect width={52} height={52} rx={16} fill="var(--popover)" stroke={n.color} strokeWidth={glow ? 3 : 1.5} />
            <foreignObject x={14} y={10} width={24} height={24}>
              <Icon style={{ color: n.color }} width={24} height={24} />
            </foreignObject>
            <text x={26} y={46} textAnchor="middle" fontSize={8} fill="currentColor" opacity={0.8} fontWeight={600}>
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function SocGauge({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const color = value < 20 ? "var(--alert)" : value > 80 ? "var(--surplus)" : "var(--battery)";
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
      <circle cx={40} cy={40} r={r} stroke="var(--muted)" strokeWidth={8} fill="none" />
      <motion.circle
        cx={40}
        cy={40}
        r={r}
        stroke={color}
        strokeWidth={8}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - value / 100) }}
        transition={{ duration: 1.2 }}
      />
    </svg>
  );
}
