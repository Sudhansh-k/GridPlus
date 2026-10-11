import { AlertTriangle, Battery, BatteryCharging, Plug, Scale, type LucideIcon } from "lucide-react";
import type { DispatchAction } from "./api";

export const ACTIONS: Record<
  DispatchAction,
  { label: string; icon: LucideIcon; text: string; bg: string; border: string; soft: string }
> = {
  CHARGE_BATTERY: { label: "Charge Battery", icon: BatteryCharging, text: "text-surplus", bg: "bg-surplus", border: "border-surplus", soft: "bg-surplus/15" },
  DISCHARGE_BATTERY: { label: "Discharge Battery", icon: Battery, text: "text-battery", bg: "bg-battery", border: "border-battery", soft: "bg-battery/15" },
  IMPORT_FROM_GRID: { label: "Import from Grid", icon: Plug, text: "text-grid", bg: "bg-grid", border: "border-grid", soft: "bg-grid/15" },
  ENERGY_SHORTAGE_ALERT: { label: "Energy Shortage Alert", icon: AlertTriangle, text: "text-alert", bg: "bg-alert", border: "border-alert", soft: "bg-alert/15" },
  BALANCED: { label: "Balanced", icon: Scale, text: "text-teal", bg: "bg-teal", border: "border-teal", soft: "bg-teal/15" },
};
