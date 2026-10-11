import { useCallback, useEffect, useState } from "react";
import { checkHealth } from "@/lib/api";

export function useTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("gridpulse.theme", next ? "dark" : "light");
    setDark(next);
    window.dispatchEvent(new Event("gridpulse:theme"));
  }, []);
  useEffect(() => {
    const h = () => setDark(document.documentElement.classList.contains("dark"));
    window.addEventListener("gridpulse:theme", h);
    return () => window.removeEventListener("gridpulse:theme", h);
  }, []);
  return { dark, toggle };
}

export function useHealth() {
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    const run = () => checkHealth().then((ok) => alive && setOnline(ok));
    run();
    const id = setInterval(run, 30000);
    window.addEventListener("gridpulse:api", run);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener("gridpulse:api", run);
    };
  }, []);
  return online;
}
