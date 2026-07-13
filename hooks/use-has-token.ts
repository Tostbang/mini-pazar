"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/helpers";

export type TokenStatus = {
  // False until the cookie has been read on the client at least once.
  // Lets callers avoid acting on the initial (pre-read) `hasToken=false`.
  ready: boolean;
  hasToken: boolean;
};

export function useHasTokenStatus(): TokenStatus {
  const [status, setStatus] = useState<TokenStatus>({
    ready: false,
    hasToken: false,
  });

  useEffect(() => {
    const read = () =>
      setStatus({ ready: true, hasToken: Boolean(getToken()) });
    read();
    const interval = window.setInterval(read, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return status;
}

export function useHasToken(): boolean {
  return useHasTokenStatus().hasToken;
}
