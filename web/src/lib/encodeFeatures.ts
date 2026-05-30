import type { FeatureMeta, ProfileForm } from "../types";

// The categories that the trained model actually emits dummies for.
// Mapping is { csv-level name (with spaces) -> model feature name (with underscores) }.
// Anything not in these maps becomes the all-zero "baseline" for that group,
// exactly as during training where those levels were dropped/unselected.
const GENDER_DUMMIES: Record<string, string> = {
  Female: "gender_Female",
  Male: "gender_Male",
  "Non-binary": "gender_Non-binary",
  Genderfluid: "gender_Genderfluid",
  Transgender: "gender_Transgender",
  "Prefer Not to Say": "gender_Prefer_Not_to_Say",
};

const LOCATION_DUMMIES: Record<string, string> = {
  Suburban: "location_type_Suburban",
  Urban: "location_type_Urban",
  Metro: "location_type_Metro",
  "Remote Area": "location_type_Remote_Area",
  // Rural, Small Town => baseline (all zeros)
};

const ORIENTATION_DUMMIES: Record<string, string> = {
  Straight: "sexual_orientation_Straight",
  Demisexual: "sexual_orientation_Demisexual",
  Gay: "sexual_orientation_Gay",
  Bisexual: "sexual_orientation_Bisexual",
  Queer: "sexual_orientation_Queer",
  // Asexual, Lesbian, Pansexual => baseline
};

const BODY_DUMMIES: Record<string, string> = {
  Athletic: "body_type_Athletic",
  Muscular: "body_type_Muscular",
  Slim: "body_type_Slim",
  // Average, Curvy, Plus Size => baseline
};

const INTENT_DUMMIES: Record<string, string> = {
  Networking: "relationship_intent_Networking",
  Exploring: "relationship_intent_Exploring",
  "Friends Only": "relationship_intent_Friends_Only",
  // Casual Dating, Hookups, Serious Relationship => baseline
};

const SWIPE_DUMMIES: Record<string, string> = {
  Afternoon: "swipe_time_of_day_Afternoon",
  "Late Night": "swipe_time_of_day_Late_Night",
  Morning: "swipe_time_of_day_Morning",
  Evening: "swipe_time_of_day_Evening",
  // After Midnight, Early Morning => baseline
};

const ALL_DUMMY_MAPS = {
  gender: GENDER_DUMMIES,
  sexualOrientation: ORIENTATION_DUMMIES,
  locationType: LOCATION_DUMMIES,
  bodyType: BODY_DUMMIES,
  relationshipIntent: INTENT_DUMMIES,
  swipeTimeOfDay: SWIPE_DUMMIES,
} as const;

/** Convert "HH:MM" to a numeric hour (0..23). Returns NaN for malformed input. */
export function parseHour(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm?.trim() ?? "");
  if (!m) return NaN;
  const h = Number(m[1]);
  return h >= 0 && h < 24 ? h : NaN;
}

export function hourToCos(hourFloat: number): number {
  return Math.cos((2 * Math.PI * hourFloat) / 24);
}

export function emojiUsageRate(messagesSent: number, messagesWithEmoji: number): number {
  if (!Number.isFinite(messagesSent) || messagesSent <= 0) return 0;
  const num = Math.min(Math.max(messagesWithEmoji, 0), messagesSent);
  return num / messagesSent;
}

/**
 * Build the Float32Array of length feature_names.length, in exactly the order
 * the ONNX model expects. Categorical values not present in the dummy maps
 * encode as all-zero for that category group (the baseline class from training).
 */
export function encodeFeatures(form: ProfileForm, meta: FeatureMeta): Float32Array {
  const featureIndex = new Map<string, number>();
  meta.feature_names.forEach((name, i) => featureIndex.set(name, i));
  const vec = new Float32Array(meta.feature_names.length);

  const hour = parseHour(form.lastActiveTime);
  const lastCos = Number.isFinite(hour)
    ? hourToCos(hour)
    : meta.baseline.numeric_medians.last_active_hour_cos;

  const numerics: Record<string, number> = {
    age: clampNumber(form.age, 18, 99, meta.baseline.numeric_medians.age),
    mutual_matches: clampNumber(
      form.mutualMatches,
      0,
      10000,
      meta.baseline.numeric_medians.mutual_matches,
    ),
    bio_length: clampNumber(
      form.bio?.trim().length ?? 0,
      0,
      5000,
      meta.baseline.numeric_medians.bio_length,
    ),
    emoji_usage_rate: emojiUsageRate(form.messagesSent, form.messagesWithEmoji),
    last_active_hour_cos: lastCos,
  };

  for (const [name, value] of Object.entries(numerics)) {
    const idx = featureIndex.get(name);
    if (idx === undefined) {
      throw new Error(`Model is missing expected numeric feature "${name}"`);
    }
    vec[idx] = value;
  }

  // Categoricals: set the single matching dummy column to 1 (or none, for baseline).
  const categoricalValues: Array<[keyof typeof ALL_DUMMY_MAPS, string]> = [
    ["gender", form.gender],
    ["sexualOrientation", form.sexualOrientation],
    ["locationType", form.locationType],
    ["bodyType", form.bodyType],
    ["relationshipIntent", form.relationshipIntent],
    ["swipeTimeOfDay", form.swipeTimeOfDay],
  ];
  for (const [group, value] of categoricalValues) {
    const dummyName = ALL_DUMMY_MAPS[group][value];
    if (dummyName === undefined) continue; // baseline: leave all zeros for this group
    const idx = featureIndex.get(dummyName);
    if (idx === undefined) {
      throw new Error(`Model is missing expected dummy "${dummyName}"`);
    }
    vec[idx] = 1;
  }

  return vec;
}

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}
