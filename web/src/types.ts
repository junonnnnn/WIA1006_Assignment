export type Gender =
  | "Female"
  | "Male"
  | "Non-binary"
  | "Genderfluid"
  | "Transgender"
  | "Prefer Not to Say";

export type SexualOrientation =
  | "Straight"
  | "Gay"
  | "Lesbian"
  | "Bisexual"
  | "Pansexual"
  | "Asexual"
  | "Demisexual"
  | "Queer";

export type LocationType =
  | "Urban"
  | "Suburban"
  | "Rural"
  | "Small Town"
  | "Metro"
  | "Remote Area";

export type BodyType =
  | "Slim"
  | "Athletic"
  | "Average"
  | "Curvy"
  | "Muscular"
  | "Plus Size";

export type RelationshipIntent =
  | "Serious Relationship"
  | "Casual Dating"
  | "Hookups"
  | "Friends Only"
  | "Networking"
  | "Exploring";

export type SwipeTimeOfDay =
  | "Early Morning"
  | "Morning"
  | "Afternoon"
  | "Evening"
  | "Late Night"
  | "After Midnight";

export interface ProfileForm {
  age: number;
  mutualMatches: number;
  bio: string;
  lastActiveTime: string; // "HH:MM"
  messagesSent: number;
  messagesWithEmoji: number;
  gender: Gender;
  sexualOrientation: SexualOrientation;
  locationType: LocationType;
  bodyType: BodyType;
  relationshipIntent: RelationshipIntent;
  swipeTimeOfDay: SwipeTimeOfDay;
}

export interface FeatureMeta {
  feature_names: string[];
  class_labels: string[];
  global_importances: Record<string, number>;
  baseline: {
    numeric_medians: {
      age: number;
      mutual_matches: number;
      bio_length: number;
      emoji_usage_rate: number;
      last_active_hour_cos: number;
    };
    categorical_modes: {
      gender: Gender;
      sexual_orientation: SexualOrientation;
      location_type: LocationType;
      body_type: BodyType;
      relationship_intent: RelationshipIntent;
      swipe_time_of_day: SwipeTimeOfDay;
    };
  };
  n_features: number;
}

export interface PredictionResult {
  probs: number[];
  topIdx: number;
  topLabel: string;
}

export type UiField =
  | "age"
  | "mutualMatches"
  | "bio"
  | "lastActiveTime"
  | "emojiUsage"
  | "gender"
  | "sexualOrientation"
  | "locationType"
  | "bodyType"
  | "relationshipIntent"
  | "swipeTimeOfDay";

export interface ExplanationEntry {
  field: UiField;
  label: string;
  delta: number; // positive => the user's value supports the predicted class
}
