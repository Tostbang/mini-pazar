"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/helpers";

export function useHasToken(): boolean {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getToken()));
    const interval = window.setInterval(() => {
      setHasToken(Boolean(getToken()));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return hasToken;
}
