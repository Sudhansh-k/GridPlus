export type RenewableType = "Solar" | "Wind" | "Hydro";
export type DispatchAction =
  | "CHARGE_BATTERY"
  | "DISCHARGE_BATTERY"
  | "IMPORT_FROM_GRID"
  | "ENERGY_SHORTAGE_ALERT"
  | "BALANCED";

export interface PredictRequest {
  Renewable_Type: RenewableType;
  Installed_Capacity_kW: number;
  Solar_Irradiance_W_m2: number;
  Temperature_C: number;
  Wind_Speed_m_s: number;
  Energy_Consumption_kW: number;
  Battery_Capacity_kWh: number;
  Battery_SOC_Percent: number;
  Grid_Available: 0 | 1;
  Electricity_Tariff_USD_per_kWh: number;
}

export interface EnergyManagement {
  predicted_surplus_kw: number;
  recommended_action: DispatchAction;
  reason: string;
}

export interface PredictResponse {
  linear_regression_prediction_kw: number;
  decision_tree_prediction_kw: number;
  target: "Energy_Production_kW";
  units: "kW";
  energy_management: EnergyManagement;
  note: string;
}

export interface PredictResult {
  data: PredictResponse;
  mock: boolean;
  error?: string;
}

export const DEFAULT_API = "http://127.0.0.1:8000";
const API_KEY = "gridpulse.apiBase";

export function normalizeBase(url: string): string {
  return url.trim().replace(/\/+$/, "") || DEFAULT_API;
}
export function getApiBase(): string {
  if (typeof window === "undefined") return DEFAULT_API;
  return normalizeBase(localStorage.getItem(API_KEY) || DEFAULT_API);
}
export function setApiBase(url: string) {
  localStorage.setItem(API_KEY, normalizeBase(url));
  window.dispatchEvent(new Event("gridpulse:api"));
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export function describeError(e: unknown): string {
  if (e instanceof DOMException && e.name === "AbortError") return "Request timed out";
  if (e instanceof TypeError) return `Network error: ${e.message} (server down, wrong URL, or CORS/mixed-content blocked)`;
  if (e instanceof Error) return e.message;
  return String(e);
}

export async function checkHealthDetailed(base = getApiBase()): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await fetchWithTimeout(`${normalizeBase(base)}/health`, {}, 4000);
    if (!r.ok) return { ok: false, error: `Server responded ${r.status} ${r.statusText}`.trim() };
    const j = (await r.json().catch(() => ({}))) as { status?: string };
    return j.status === "ok" ? { ok: true } : { ok: false, error: `Unexpected /health response: ${JSON.stringify(j)}` };
  } catch (e) {
    return { ok: false, error: describeError(e) };
  }
}

export async function checkHealth(base = getApiBase()): Promise<boolean> {
  return (await checkHealthDetailed(base)).ok;
}

/** Dispatch rules — mirrors the backend logic. */
export function decideAction(
  production: number,
  consumption: number,
  soc: number,
  grid: 0 | 1,
): EnergyManagement {
  const balance = +(production - consumption).toFixed(2);
  if (balance > 5 && soc < 95)
    return { predicted_surplus_kw: balance, recommended_action: "CHARGE_BATTERY", reason: `Surplus of ${balance} kW and battery at ${soc}% — store excess energy.` };
  if (balance < -5 && soc > 20)
    return { predicted_surplus_kw: balance, recommended_action: "DISCHARGE_BATTERY", reason: `Deficit of ${Math.abs(balance)} kW; battery at ${soc}% can cover the load.` };
  if (balance < -5 && grid === 1)
    return { predicted_surplus_kw: balance, recommended_action: "IMPORT_FROM_GRID", reason: `Deficit of ${Math.abs(balance)} kW and battery low — import from the grid.` };
  if (balance < -5)
    return { predicted_surplus_kw: balance, recommended_action: "ENERGY_SHORTAGE_ALERT", reason: `Deficit of ${Math.abs(balance)} kW, battery low and grid unavailable.` };
  return { predicted_surplus_kw: balance, recommended_action: "BALANCED", reason: "Production and consumption are roughly in balance." };
}

/** Physics-ish mock used when the backend is offline. */
export function mockPredict(req: PredictRequest): PredictResponse {
  const cap = req.Installed_Capacity_kW;
  let dt: number;
  if (req.Renewable_Type === "Solar") {
    dt = cap * (req.Solar_Irradiance_W_m2 / 1000) * 0.78 * (1 - 0.004 * (req.Temperature_C - 25));
  } else if (req.Renewable_Type === "Wind") {
    const v = req.Wind_Speed_m_s;
    dt = v < 3 || v > 25 ? 0 : cap * Math.min(1, Math.pow(v / 12, 3)) * 0.9;
  } else {
    dt = cap * 0.55;
  }
  dt = Math.max(0, +dt.toFixed(2));
  const lr = Math.max(0, +(dt * 0.88 + cap * 0.03).toFixed(2));
  return {
    linear_regression_prediction_kw: lr,
    decision_tree_prediction_kw: dt,
    target: "Energy_Production_kW",
    units: "kW",
    energy_management: decideAction(dt, req.Energy_Consumption_kW, req.Battery_SOC_Percent, req.Grid_Available),
    note: "Mock prediction generated in the browser because the backend was unreachable.",
  };
}

export async function predict(req: PredictRequest): Promise<PredictResult> {
  try {
    const r = await fetchWithTimeout(`${getApiBase()}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (r.status === 422) {
      const j = await r.json().catch(() => ({}));
      const detail = Array.isArray(j?.detail)
        ? j.detail.map((d: { loc?: string[]; msg?: string }) => `${d.loc?.at(-1)}: ${d.msg}`).join("; ")
        : "Invalid input";
      throw new ApiError(`Validation error — ${detail}`, 422);
    }
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      let detail = body;
      try { const j = JSON.parse(body); detail = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail ?? j); } catch { /* plain text */ }
      throw new ApiError(`Server error ${r.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`, r.status);
    }
    return { data: (await r.json()) as PredictResponse, mock: false };
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) throw e;
    const msg = describeError(e);
    return { data: mockPredict(req), mock: true, error: msg };
  }
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/* ---------- history ---------- */
export interface HistoryEntry {
  id: string;
  at: number;
  request: PredictRequest;
  response: PredictResponse;
  mock: boolean;
}
const HIST_KEY = "gridpulse.history";
export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    // Drop mock/fallback entries saved by older versions — only real API results count.
    const list = (JSON.parse(localStorage.getItem(HIST_KEY) || "[]") as HistoryEntry[]).filter((e) => !e.mock);
    localStorage.setItem(HIST_KEY, JSON.stringify(list));
    return list;
  } catch {
    return [];
  }
}
export function addHistory(e: Omit<HistoryEntry, "id" | "at">) {
  const list = [{ ...e, id: crypto.randomUUID(), at: Date.now() }, ...getHistory()].slice(0, 10);
  localStorage.setItem(HIST_KEY, JSON.stringify(list));
}
export function clearHistory() {
  localStorage.removeItem(HIST_KEY);
  window.dispatchEvent(new Event("gridpulse:history"));
}

export const DEMO_REQUEST: PredictRequest = {
  Renewable_Type: "Solar",
  Installed_Capacity_kW: 250,
  Solar_Irradiance_W_m2: 750,
  Temperature_C: 29,
  Wind_Speed_m_s: 5,
  Energy_Consumption_kW: 140,
  Battery_Capacity_kWh: 400,
  Battery_SOC_Percent: 55,
  Grid_Available: 1,
  Electricity_Tariff_USD_per_kWh: 0.16,
};
