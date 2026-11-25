"use client";

import { useEffect, useState } from "react";
import { checkHealth } from "@/lib/api";

export type BackendStatus = "checking" | "online" | "offline";

/** Pings the backend /health endpoint every 15 seconds. */
export function useBackendStatus(intervalMs = 15000): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>("checking");

  useEffect(() => {
    let active = true;

    const check = async () => {
      const ok = await checkHealth();
      if (active) setStatus(ok ? "online" : "offline");
    };

    check();
    const timer = setInterval(check, intervalMs);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [intervalMs]);

  return status;
}