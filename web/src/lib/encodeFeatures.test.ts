import { describe, expect, it } from "vitest";
import { encodeFeatures, hourToCos, parseHour, emojiUsageRate } from "./encodeFeatures";
import type { FeatureMeta, ProfileForm } from "../types";

const FEATURE_NAMES = [
  "age",
  "mutual_matches",
  "emoji_usage_rate",
  "bio_length",
  "last_active_hour_cos",
  "gender_Non-binary",
  "gender_Genderfluid",
  "gender_Prefer_Not_to_Say",
  "location_type_Suburban",
  "sexual_orientation_Straight",
  "gender_Female",
  "location_type_Urban",
  "swipe_time_of_day_Afternoon",
  "body_type_Athletic",
  "sexual_orientation_Demisexual",
  "sexual_orientation_Gay",
  "relationship_intent_Networking",
  "location_type_Remote_Area",
  "swipe_time_of_day_Late_Night",
  "body_type_Muscular",
  "sexual_orientation_Bisexual",
  "relationship_intent_Exploring",
  "relationship_intent_Friends_Only",
  "swipe_time_of_day_Morning",
  "gender_Transgender",
  "gender_Male",
  "body_type_Slim",
  "sexual_orientation_Queer",
  "location_type_Metro",
  "swipe_time_of_day_Evening",
];

const META: FeatureMeta = {
  feature_names: FEATURE_NAMES,
  class_labels: ["A", "B"],
  global_importances: {},
  baseline: {
    numeric_medians: {
      age: 38,
      mutual_matches: 13,
      bio_length: 250,
      emoji_usage_rate: 0.27,
      last_active_hour_cos: -1,
    },
    categorical_modes: {
      gender: "Female",
      sexual_orientation: "Straight",
      location_type: "Remote Area",
      body_type: "Slim",
      relationship_intent: "Serious Relationship",
      swipe_time_of_day: "After Midnight",
    },
  },
  n_features: 30,
};

const BASE_FORM: ProfileForm = {
  age: 28,
  mutualMatches: 12,
  bio: "x".repeat(150),
  lastActiveTime: "22:30",
  messagesSent: 200,
  messagesWithEmoji: 80,
  gender: "Female",
  sexualOrientation: "Bisexual",
  locationType: "Urban",
  bodyType: "Athletic",
  relationshipIntent: "Serious Relationship",
  swipeTimeOfDay: "Evening",
};

describe("parseHour / hourToCos", () => {
  it("parses HH:MM and converts to cosine", () => {
    expect(parseHour("00:00")).toBe(0);
    expect(parseHour("12:00")).toBe(12);
    expect(parseHour("23:59")).toBe(23);
    expect(parseHour("")).toBeNaN();
    expect(parseHour("99:00")).toBeNaN();
    expect(hourToCos(0)).toBeCloseTo(1, 6);
    expect(hourToCos(12)).toBeCloseTo(-1, 6);
    expect(hourToCos(6)).toBeCloseTo(0, 6);
  });
});

describe("emojiUsageRate", () => {
  it("computes ratio safely", () => {
    expect(emojiUsageRate(200, 80)).toBeCloseTo(0.4);
    expect(emojiUsageRate(0, 50)).toBe(0);
    expect(emojiUsageRate(100, 250)).toBeCloseTo(1.0); // clamp num <= denom
    expect(emojiUsageRate(100, -10)).toBe(0);
  });
});

describe("encodeFeatures", () => {
  it("produces a length-30 Float32Array in model order", () => {
    const v = encodeFeatures(BASE_FORM, META);
    expect(v).toBeInstanceOf(Float32Array);
    expect(v.length).toBe(30);
  });

  it("places numerics at the correct indices", () => {
    const v = encodeFeatures(BASE_FORM, META);
    expect(v[0]).toBe(28); // age
    expect(v[1]).toBe(12); // mutual_matches
    expect(v[2]).toBeCloseTo(80 / 200, 6); // emoji_usage_rate
    expect(v[3]).toBe(150); // bio_length
    // parseHour discards minutes — training data used integer hours.
    expect(v[4]).toBeCloseTo(Math.cos((2 * Math.PI * 22) / 24), 6);
  });

  it("activates exactly one dummy per category, where the level has a dummy", () => {
    const v = encodeFeatures(BASE_FORM, META);
    const idx = (name: string) => FEATURE_NAMES.indexOf(name);
    // Female gender, Bisexual orientation, Urban location, Athletic body,
    // Serious Relationship intent (baseline -> all zero), Evening swipe time.
    expect(v[idx("gender_Female")]).toBe(1);
    expect(v[idx("gender_Male")]).toBe(0);
    expect(v[idx("sexual_orientation_Bisexual")]).toBe(1);
    expect(v[idx("location_type_Urban")]).toBe(1);
    expect(v[idx("body_type_Athletic")]).toBe(1);
    expect(v[idx("swipe_time_of_day_Evening")]).toBe(1);

    // Serious Relationship is a baseline level — none of the three intent
    // dummies should be set.
    expect(v[idx("relationship_intent_Networking")]).toBe(0);
    expect(v[idx("relationship_intent_Exploring")]).toBe(0);
    expect(v[idx("relationship_intent_Friends_Only")]).toBe(0);
  });

  it("encodes baseline categorical levels as all-zeros for that group", () => {
    const baselineForm: ProfileForm = {
      ...BASE_FORM,
      locationType: "Rural", // not present in dummies
      sexualOrientation: "Asexual", // not present
      bodyType: "Curvy", // not present
      relationshipIntent: "Hookups", // not present
      swipeTimeOfDay: "Early Morning", // not present
    };
    const v = encodeFeatures(baselineForm, META);

    const categoryDummies = {
      location_type: [
        "location_type_Suburban",
        "location_type_Urban",
        "location_type_Metro",
        "location_type_Remote_Area",
      ],
      sexual_orientation: [
        "sexual_orientation_Straight",
        "sexual_orientation_Demisexual",
        "sexual_orientation_Gay",
        "sexual_orientation_Bisexual",
        "sexual_orientation_Queer",
      ],
      body_type: ["body_type_Athletic", "body_type_Muscular", "body_type_Slim"],
      relationship_intent: [
        "relationship_intent_Networking",
        "relationship_intent_Exploring",
        "relationship_intent_Friends_Only",
      ],
      swipe_time_of_day: [
        "swipe_time_of_day_Afternoon",
        "swipe_time_of_day_Late_Night",
        "swipe_time_of_day_Morning",
        "swipe_time_of_day_Evening",
      ],
    };
    for (const dummies of Object.values(categoryDummies)) {
      for (const d of dummies) {
        expect(v[FEATURE_NAMES.indexOf(d)]).toBe(0);
      }
    }
  });

  it("clamps out-of-range numerics rather than producing NaN", () => {
    const bad = encodeFeatures(
      { ...BASE_FORM, age: -5, mutualMatches: NaN as unknown as number },
      META,
    );
    expect(bad[0]).toBe(18); // clamped to min
    expect(bad[1]).toBe(META.baseline.numeric_medians.mutual_matches); // NaN -> baseline
  });
});
