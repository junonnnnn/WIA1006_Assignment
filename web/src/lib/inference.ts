import * as ort from "onnxruntime-web";
import type { FeatureMeta, PredictionResult } from "../types";

// Tell ORT where to find its .wasm assets — Vite copies them next to model.onnx
// under BASE_URL via vite-plugin-static-copy.
ort.env.wasm.wasmPaths = import.meta.env.BASE_URL;
ort.env.wasm.numThreads = 1; // single-thread WASM is plenty for a 30-feature model

let sessionPromise: Promise<ort.InferenceSession> | null = null;
let metaPromise: Promise<FeatureMeta> | null = null;

export function getMeta(): Promise<FeatureMeta> {
  if (!metaPromise) {
    metaPromise = fetch(`${import.meta.env.BASE_URL}feature_meta.json`).then(
      (r) => {
        if (!r.ok) throw new Error(`feature_meta.json: ${r.status}`);
        return r.json() as Promise<FeatureMeta>;
      },
    );
  }
  return metaPromise;
}

export function getSession(): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(
      `${import.meta.env.BASE_URL}model.onnx`,
      { executionProviders: ["wasm"], graphOptimizationLevel: "all" },
    );
  }
  return sessionPromise;
}

/** Preload both meta + ONNX session in parallel — kick off on app mount. */
export async function warmup(): Promise<void> {
  await Promise.all([getMeta(), getSession()]);
}

export async function predict(features: Float32Array): Promise<PredictionResult> {
  const [session, meta] = await Promise.all([getSession(), getMeta()]);
  const input = new ort.Tensor("float32", features, [1, features.length]);
  const out = await session.run({ [session.inputNames[0]]: input });

  // With zipmap=false, one output is shape [1, 10] probabilities;
  // the other is the predicted label tensor. Pick by shape.
  let probs: number[] | null = null;
  for (const name of session.outputNames) {
    const t = out[name];
    if (t && t.dims.length === 2 && t.dims[1] === meta.class_labels.length) {
      probs = Array.from(t.data as Float32Array);
      break;
    }
  }
  if (!probs) throw new Error("No probability tensor in ONNX outputs");

  let topIdx = 0;
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > probs[topIdx]) topIdx = i;
  }
  return { probs, topIdx, topLabel: meta.class_labels[topIdx] };
}
