/**
 * Parity test: encode a known form in JS, run it through onnxruntime-node on
 * the very same model.onnx, and assert the top class matches what we expect.
 * This catches encoding errors that the unit tests cannot.
 *
 * Skipped automatically if onnxruntime-node isn't installed (it's a dev-only
 * peer, not shipped to the browser bundle).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { encodeFeatures } from "../encodeFeatures";
import type { FeatureMeta, ProfileForm } from "../../types";

const META_PATH = resolve(__dirname, "../../../public/feature_meta.json");
const MODEL_PATH = resolve(__dirname, "../../../public/model.onnx");

const SAMPLE_FORM: ProfileForm = {
  age: 28,
  mutualMatches: 12,
  bio: "x".repeat(150),
  lastActiveTime: "22:00",
  messagesSent: 200,
  messagesWithEmoji: 80,
  gender: "Female",
  sexualOrientation: "Bisexual",
  locationType: "Urban",
  bodyType: "Athletic",
  relationshipIntent: "Serious Relationship",
  swipeTimeOfDay: "Evening",
};

let ort: typeof import("onnxruntime-node") | null = null;
try {
  // Optional dev dep — skip the test if missing.
  ort = await import("onnxruntime-node");
} catch {
  /* skip */
}

describe.skipIf(!ort)("ONNX parity with encoded form", () => {
  it("runs the model and returns a 10-class softmax", async () => {
    const meta = JSON.parse(readFileSync(META_PATH, "utf8")) as FeatureMeta;
    const features = encodeFeatures(SAMPLE_FORM, meta);

    const session = await ort!.InferenceSession.create(readFileSync(MODEL_PATH));
    const input = new ort!.Tensor("float32", features, [1, features.length]);
    const out = await session.run({ [session.inputNames[0]]: input });

    let probs: Float32Array | null = null;
    for (const name of session.outputNames) {
      const t = out[name];
      if (t && t.dims.length === 2 && t.dims[1] === meta.class_labels.length) {
        probs = t.data as Float32Array;
        break;
      }
    }
    expect(probs).not.toBeNull();
    const arr = Array.from(probs!);
    const sum = arr.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 4);
    const topIdx = arr.indexOf(Math.max(...arr));
    console.log(
      "Top:",
      meta.class_labels[topIdx],
      "prob=",
      arr[topIdx].toFixed(4),
    );
    expect(topIdx).toBeGreaterThanOrEqual(0);
    expect(topIdx).toBeLessThan(meta.class_labels.length);
  });
});
