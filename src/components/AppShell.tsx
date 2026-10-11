import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Activity, BrainCircuit, GitBranch, Home, LayoutDashboard, Moon, Settings, Sun, Zap } from "lucide-react";
import { useHealth, useTheme } from "@/hooks/use-app";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/predictor", label: "Predictor", icon: Activity },
  { to: "/insights", label: "Insights", icon: BrainCircuit },
  { to: "/dispatch", label: "Dispatch", icon: GitBranch },
  { to: "/about", label: "Settings", icon: Settings },
] as const;

export function HealthBadge() {
  const online = useHealth();
  const color = online === null ? "bg-muted-foreground" : online ? "bg-surplus" : "bg-alert";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium" aria-live="polite">
      <span className={cn("h-2 w-2 rounded-full", color, online && "animate-pulse")} />
      {online === null ? "Checking API…" : online ? "API online" : "API offline · mock mode"}
    </span>
  );
}

export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button onClick={toggle} aria-label="Toggle theme" className="grid h-9 w-9 place-items-center rounded-xl border hover:bg-accent transition-colors">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar p-4 backdrop-blur-xl lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand shadow-glow">
            <Zap className="h-5 w-5 text-on-accent" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">GridPulse</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-foreground"
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto px-2 text-[11px] leading-relaxed text-muted-foreground">
          Educational demo · synthetic data
        </p>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-background/70 px-4 backdrop-blur-xl md:px-8">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand">
              <Zap className="h-4 w-4 text-on-accent" />
            </span>
            <span className="font-extrabold">GridPulse</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <HealthBadge />
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-8 lg:pb-12">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-sidebar py-2 backdrop-blur-xl lg:hidden" aria-label="Mobile">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: true }}
            className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] text-muted-foreground data-[status=active]:text-primary"
          >
            <n.icon className="h-5 w-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
