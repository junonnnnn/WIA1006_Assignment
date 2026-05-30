import { encodeFeatures } from "./encodeFeatures";
import { predict } from "./inference";
import { UI_FIELD_LABELS } from "./constants";
import type {
  ExplanationEntry,
  FeatureMeta,
  PredictionResult,
  ProfileForm,
  UiField,
} from "../types";

/**
 * Per-prediction explanation by leave-one-field-out perturbation.
 *
 * For each UI field, replace it with the dataset baseline (median for numeric,
 * mode for categorical), re-encode + re-predict, and record the change in the
 * probability of the originally-predicted class. Positive delta means the
 * user's actual value PUSHED toward the predicted outcome; negative means it
 * pulled away (the prediction would have been stronger without it).
 */
export async function explainPrediction(
  form: ProfileForm,
  meta: FeatureMeta,
  baseline: PredictionResult,
): Promise<ExplanationEntry[]> {
  const targetClass = baseline.topIdx;
  const baseProb = baseline.probs[targetClass];

  const perturbations: Array<{ field: UiField; form: ProfileForm }> = [
    { field: "age", form: { ...form, age: meta.baseline.numeric_medians.age } },
    {
      field: "mutualMatches",
      form: { ...form, mutualMatches: meta.baseline.numeric_medians.mutual_matches },
    },
    {
      field: "bio",
      form: { ...form, bio: "x".repeat(meta.baseline.numeric_medians.bio_length) },
    },
    {
      field: "lastActiveTime",
      // Cannot pick an "HH:MM" that produces an arbitrary cos directly, but the
      // median in the dataset rounded to integer hour is fine for a baseline.
      form: { ...form, lastActiveTime: "12:00" },
    },
    {
      field: "emojiUsage",
      // Match the baseline rate by picking matching numerator/denominator.
      form: {
        ...form,
        messagesSent: 100,
        messagesWithEmoji: Math.round(
          100 * meta.baseline.numeric_medians.emoji_usage_rate,
        ),
      },
    },
    { field: "gender", form: { ...form, gender: meta.baseline.categorical_modes.gender } },
    {
      field: "sexualOrientation",
      form: {
        ...form,
        sexualOrientation: meta.baseline.categorical_modes.sexual_orientation,
      },
    },
    {
      field: "locationType",
      form: { ...form, locationType: meta.baseline.categorical_modes.location_type },
    },
    {
      field: "bodyType",
      form: { ...form, bodyType: meta.baseline.categorical_modes.body_type },
    },
    {
      field: "relationshipIntent",
      form: {
        ...form,
        relationshipIntent: meta.baseline.categorical_modes.relationship_intent,
      },
    },
    {
      field: "swipeTimeOfDay",
      form: {
        ...form,
        swipeTimeOfDay: meta.baseline.categorical_modes.swipe_time_of_day,
      },
    },
  ];

  const results: ExplanationEntry[] = [];
  for (const p of perturbations) {
    if (deepEquals(p.form, form)) continue; // user's value already matches baseline
    const feats = encodeFeatures(p.form, meta);
    const pred = await predict(feats);
    const delta = baseProb - pred.probs[targetClass];
    results.push({
      field: p.field,
      label: UI_FIELD_LABELS[p.field],
      delta,
    });
  }

  results.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return results;
}

function deepEquals<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
