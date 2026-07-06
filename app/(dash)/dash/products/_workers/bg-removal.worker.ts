/// <reference lib="webworker" />

// Runs the background-removal ONNX/WASM model off the main thread so the
// dialog stays interactive during inference. The library uses OffscreenCanvas
// and createImageBitmap internally, both of which are available in workers.
//
// Cancellation: the worker only ever resolves the most recent runId. If a new
// "process" message arrives, the in-flight promise's result is silently
// discarded, matching the run-id pattern used by the editor on the main
// thread.

type ProgressKey =
  | "fetch:model"
  | "fetch:wasm"
  | "compute:download"
  | "compute:inference"
  | string;

type ProcessRequest = {
  type: "process";
  runId: number;
  blob: Blob;
};

type CancelRequest = {
  type: "cancel";
};

type WorkerRequest = ProcessRequest | CancelRequest;

type ProgressMessage = {
  type: "progress";
  runId: number;
  key: ProgressKey;
  current: number;
  total: number;
};

type DoneMessage = {
  type: "done";
  runId: number;
  blob: Blob;
};

type ErrorMessage = {
  type: "error";
  runId: number;
  message: string;
};

type WorkerMessage = ProgressMessage | DoneMessage | ErrorMessage;

declare const self: DedicatedWorkerGlobalScope;

// Each new "process" message bumps this. Done/error messages only post if
// the runId still matches when they fire.
let activeRunId = 0;

async function getRemoveBackground() {
  // Dynamic import so the ONNX/WASM payload is only fetched on first use.
  // The module is cached by the bundler and by the library itself.
  const mod = await import("@imgly/background-removal");
  // The library resolves its wasm/model files relative to publicPath. In a
  // worker context, import.meta.url points to this file, and Turbopack
  // bundles resources.json + wasm alongside it.
  const publicPath = new URL("./", self.location.href).toString();
  return (input: Blob, onProgress: (key: string, current: number, total: number) => void) =>
    mod.removeBackground(input, {
      publicPath,
      progress: (key, current, total) => onProgress(key, current, total),
      output: {
        format: "image/png",
        quality: 0.95,
      },
    });
}

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const data = event.data;
  if (data.type === "cancel") {
    activeRunId += 1;
    return;
  }
  if (data.type !== "process") return;

  const { runId, blob } = data;
  activeRunId = runId;

  try {
    const removeBackground = await getRemoveBackground();
    const result = await removeBackground(blob, (key, current, total) => {
      if (activeRunId !== runId) return;
      const message: ProgressMessage = { type: "progress", runId, key, current, total };
      self.postMessage(message);
    });

    // If the user kicked off a newer run (or cancelled) while we were
    // working, drop this result so the main thread doesn't see a stale
    // preview.
    if (activeRunId !== runId) return;

    const message: DoneMessage = { type: "done", runId, blob: result };
    self.postMessage(message);
  } catch (err) {
    if (activeRunId !== runId) return;
    const message: ErrorMessage = {
      type: "error",
      runId,
      message: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(message);
  }
});

export type { WorkerRequest, WorkerMessage, ProgressMessage, DoneMessage, ErrorMessage };