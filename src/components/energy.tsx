import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import { Battery, Droplets, Home, Plug, Sun, Wind } from "lucide-react";
import type { EnergyManagement, RenewableType } from "@/lib/api";
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
type Edge = { from: string; to: string; kw: number; color: string; active: boolean };

/** Microgrid diagram driven by the latest prediction: active source, direction and kW labels follow the action. */
export function EnergyFlow({
  production = 180,
  consumption = 140,
  action = "CHARGE_BATTERY",
  source = "Solar",
  compact,
}: {
  production?: number;
  consumption?: number;
  action?: EnergyManagement["recommended_action"];
  source?: RenewableType;
  compact?: boolean;
}) {
  const nodes: Record<string, Node> = {
    Solar: { x: 60, y: 50, label: "Solar", icon: Sun, color: "var(--solar)" },
    Wind: { x: 60, y: 150, label: "Wind", icon: Wind, color: "var(--wind)" },
    Hydro: { x: 60, y: 250, label: "Hydro", icon: Droplets, color: "var(--hydro)" },
    battery: { x: 250, y: 240, label: "Battery", icon: Battery, color: "var(--battery)" },
    load: { x: 440, y: 80, label: "Load", icon: Home, color: "var(--teal)" },
    grid: { x: 440, y: 240, label: "Grid", icon: Plug, color: "var(--grid)" },
  };
  const w = (kw: number) => Math.max(1.5, Math.min(8, Math.abs(kw) / 40));
  const surplus = production - consumption;
  const deficit = Math.max(0, -surplus);
  const src = nodes[source]!;
  const toLoad = Math.min(production, consumption);

  const edges: Edge[] = [{ from: source, to: "load", kw: toLoad, color: src.color, active: toLoad > 0 }];
  if (action === "CHARGE_BATTERY") edges.push({ from: source, to: "battery", kw: surplus, color: "var(--surplus)", active: true });
  if (action === "DISCHARGE_BATTERY") edges.push({ from: "battery", to: "load", kw: deficit, color: "var(--battery)", active: true });
  if (action === "IMPORT_FROM_GRID") edges.push({ from: "grid", to: "load", kw: deficit, color: "var(--grid)", active: true });
  if (action === "ENERGY_SHORTAGE_ALERT") edges.push({ from: "grid", to: "load", kw: deficit, color: "var(--alert)", active: false });
  if (action !== "IMPORT_FROM_GRID" && action !== "ENERGY_SHORTAGE_ALERT") edges.push({ from: "grid", to: "load", kw: 0, color: "var(--grid)", active: false });

  const highlighted = new Set<string>([source, "load", ...edges.filter((e) => e.active).flatMap((e) => [e.from, e.to])]);

  return (
    <svg viewBox="0 0 500 300" className={cn("w-full", compact ? "max-h-64" : "max-h-80")} role="img" aria-label={`Energy flow: ${source} source, action ${action}`}>
      <defs>
        {edges.map((e, i) => (
          <marker key={i} id={`arr-${i}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={e.color} />
          </marker>
        ))}
      </defs>
      {edges.map((e, i) => {
        const a = nodes[e.from]!;
        const b = nodes[e.to]!;
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        const x1 = a.x + ux * 30, y1 = a.y + uy * 30, x2 = b.x - ux * 32, y2 = b.y - uy * 32;
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const cx = mx - uy * 25, cy = my + ux * 25;
        const d = `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
        const lx = (x1 + 2 * cx + x2) / 4, ly = (y1 + 2 * cy + y2) / 4;
        return (
          <g key={i} opacity={e.active ? 1 : 0.25}>
            <path d={d} stroke={e.color} strokeOpacity={0.15} strokeWidth={w(e.kw) + 5} fill="none" />
            <path d={d} stroke={e.color} strokeWidth={w(e.kw)} fill="none" strokeLinecap="round" className={e.active ? "flow-dash" : ""} markerEnd={e.active ? `url(#arr-${i})` : undefined} />
            {e.active && (
              <g transform={`translate(${lx},${ly})`}>
                <rect x={-26} y={-9} width={52} height={18} rx={9} fill="var(--popover)" stroke={e.color} strokeWidth={1} />
                <text textAnchor="middle" dy={4} fontSize={10} fontWeight={700} fill={e.color}>{Math.abs(e.kw).toFixed(1)} kW</text>
              </g>
            )}
          </g>
        );
      })}
      {Object.entries(nodes).map(([k, n]) => {
        const Icon = n.icon;
        const on = highlighted.has(k);
        const isSrc = k === source;
        return (
          <g key={k} transform={`translate(${n.x - 26},${n.y - 26})`} opacity={on ? 1 : 0.3}>
            <rect width={52} height={52} rx={16} fill="var(--popover)" stroke={n.color} strokeWidth={isSrc ? 3 : 1.5} />
            <foreignObject x={14} y={10} width={24} height={24}>
              <Icon style={{ color: n.color }} width={24} height={24} />
            </foreignObject>
            <text x={26} y={46} textAnchor="middle" fontSize={8} fill="currentColor" opacity={0.8} fontWeight={600}>
              {n.label}
            </text>
            {isSrc && (
              <text x={26} y={-6} textAnchor="middle" fontSize={9} fontWeight={700} fill={n.color}>{production.toFixed(1)} kW</text>
            )}
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
