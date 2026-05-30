import type {
  BodyType,
  Gender,
  LocationType,
  RelationshipIntent,
  SexualOrientation,
  SwipeTimeOfDay,
} from "../types";

export const GENDERS: Gender[] = [
  "Female",
  "Male",
  "Non-binary",
  "Genderfluid",
  "Transgender",
  "Prefer Not to Say",
];

export const SEXUAL_ORIENTATIONS: SexualOrientation[] = [
  "Straight",
  "Gay",
  "Lesbian",
  "Bisexual",
  "Pansexual",
  "Asexual",
  "Demisexual",
  "Queer",
];

export const LOCATION_TYPES: LocationType[] = [
  "Urban",
  "Suburban",
  "Rural",
  "Small Town",
  "Metro",
  "Remote Area",
];

export const BODY_TYPES: BodyType[] = [
  "Slim",
  "Athletic",
  "Average",
  "Curvy",
  "Muscular",
  "Plus Size",
];

export const RELATIONSHIP_INTENTS: RelationshipIntent[] = [
  "Serious Relationship",
  "Casual Dating",
  "Hookups",
  "Friends Only",
  "Networking",
  "Exploring",
];

export const SWIPE_TIMES: SwipeTimeOfDay[] = [
  "Early Morning",
  "Morning",
  "Afternoon",
  "Evening",
  "Late Night",
  "After Midnight",
];

// One-line plain-English description per outcome, shown in the result card.
export const OUTCOME_DESCRIPTIONS: Record<string, string> = {
  Blocked: "Your profile is most likely to be blocked by matches.",
  Catfished: "Interactions tend to go sideways — be cautious of bad-faith profiles.",
  "Chat Ignored": "Matches start but conversations rarely take off.",
  "Date Happened": "Your pattern most often leads to an in-person date.",
  Ghosted: "Conversations begin but tend to fade without warning.",
  "Instant Match": "You're most likely to land an immediate mutual match.",
  "Mutual Match": "Matches tend to be mutual and stick around.",
  "No Action": "Profiles like yours often see little engagement either way.",
  "One-sided Like": "You're more likely to like profiles than to be liked back.",
  "Relationship Formed": "Your pattern is most consistent with forming a real relationship.",
};

// Single emoji glyph per outcome — SF-style minimal.
export const OUTCOME_EMOJI: Record<string, string> = {
  Blocked: "⛔",
  Catfished: "🎭",
  "Chat Ignored": "💤",
  "Date Happened": "☕",
  Ghosted: "👻",
  "Instant Match": "⚡",
  "Mutual Match": "💞",
  "No Action": "·",
  "One-sided Like": "↗",
  "Relationship Formed": "💍",
};

// Friendly labels for explanation panel.
export const UI_FIELD_LABELS = {
  age: "Age",
  mutualMatches: "Mutual matches",
  bio: "Bio length",
  lastActiveTime: "Last-active time",
  emojiUsage: "Emoji usage",
  gender: "Gender",
  sexualOrientation: "Sexual orientation",
  locationType: "Location type",
  bodyType: "Body type",
  relationshipIntent: "Relationship intent",
  swipeTimeOfDay: "Swipe time of day",
} as const;
