"use client";

import { useEffect, useRef } from "react";
import type {
  WorkerMessage,
  WorkerRequest,
} from "../_workers/bg-removal.worker";

export type BackgroundRemovalProgress = {
  key: string;
  current: number;
  total: number;
};

export type RemoveBackgroundOptions = {
  /** Bumped by the caller on every new run. The hook discards any result
   * whose runId no longer matches the caller's latest. */
  runId: number;
  onProgress?: (progress: BackgroundRemovalProgress) => void;
};

export type BackgroundRemovalHandle = {
  /** Runs background removal off the main thread. Resolves with the cutout
   * PNG, or rejects if the worker reports an error. The promise never
   * resolves if the caller's runId has moved on — the caller is expected
   * to ignore stale results via its own runId check. */
  removeBackground: (
    blob: Blob,
    options: RemoveBackgroundOptions,
  ) => Promise<Blob>;
  /** Tells the worker to drop its current run. Safe to call repeatedly. */
  cancel: () => void;
};

type Pending = {
  runId: number;
  resolve: (blob: Blob) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: BackgroundRemovalProgress) => void;
};

// Module-level worker singleton. There is at most one background-removal
// session open at a time (the image editor dialog), so a single worker is
// enough. The worker outlives the component that triggered it, which matches
// the preload behaviour in `dash-providers.tsx`.
let workerInstance: Worker | null = null;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (workerInstance) return workerInstance;
  // Worker is a browser-only global. During server-side prerendering the
  // hook is still invoked (this module sits inside a client component tree
  // that Next.js renders to HTML before hydration). Bail out so the
  // prerender doesn't throw — the actual worker is spun up in the effect
  // below once we are in the browser.
  if (typeof Worker === "undefined") {
    throw new Error("Background-removal worker is only available in the browser.");
  }
  const worker = new Worker(
    new URL("../_workers/bg-removal.worker.ts", import.meta.url),
    { type: "module" },
  );
  worker.addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
    const data = event.data;
    const entry = pending.get(data.runId);
    if (!entry) return;
    if (data.type === "progress") {
      entry.onProgress?.({ key: data.key, current: data.current, total: data.total });
      return;
    }
    pending.delete(data.runId);
    if (data.type === "done") {
      entry.resolve(data.blob);
    } else {
      entry.reject(new Error(data.message));
    }
  });
  worker.addEventListener("error", (event) => {
    // A worker-level error kills every pending request — surface it as a
    // rejection so the editor's catch block can show a toast.
    const message = event.message || "Arka plan kaldırma worker'ı başarısız oldu.";
    for (const entry of pending.values()) {
      entry.reject(new Error(message));
    }
    pending.clear();
  });
  workerInstance = worker;
  return worker;
}

export function useBackgroundRemoval(): BackgroundRemovalHandle {
  // The worker is browser-only. We start with `null` so server-side renders
  // (and the initial client render before effects run) stay Worker-free.
  // It is created lazily on mount via the effect below.
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!workerRef.current) {
      try {
        workerRef.current = getWorker();
      } catch (error) {
        // If the platform has no Worker support, leave the ref null. Any
        // call to removeBackground/cancel will surface a clear error.
        console.warn("[bg-removal] worker unavailable", error);
      }
    }

    // We intentionally do not terminate the worker on unmount: the model
    // stays cached in IndexedDB and the worker is cheap to keep around.
    // Returning a no-op cleanup avoids React's strict-mode teardown warning.
    return () => undefined;
  }, []);

  const cancel = () => {
    const worker = workerRef.current ?? getWorker();
    const message: WorkerRequest = { type: "cancel" };
    worker.postMessage(message);
  };

  const removeBackground = (blob: Blob, options: RemoveBackgroundOptions) => {
    const worker = workerRef.current ?? getWorker();
    const { runId, onProgress } = options;
    return new Promise<Blob>((resolve, reject) => {
      pending.set(runId, { runId, resolve, reject, onProgress });
      const message: WorkerRequest = { type: "process", runId, blob };
      worker.postMessage(message);
    });
  };

  return { removeBackground, cancel };
}