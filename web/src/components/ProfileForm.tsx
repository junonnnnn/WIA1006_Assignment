import { useId } from "react";
import type { ProfileForm as ProfileFormState } from "../types";
import {
  BODY_TYPES,
  GENDERS,
  LOCATION_TYPES,
  RELATIONSHIP_INTENTS,
  SEXUAL_ORIENTATIONS,
  SWIPE_TIMES,
} from "../lib/constants";

interface Props {
  value: ProfileFormState;
  onChange: (next: ProfileFormState) => void;
  onSubmit: () => void;
  busy: boolean;
}

export function ProfileForm({ value, onChange, onSubmit, busy }: Props) {
  const set = <K extends keyof ProfileFormState>(k: K, v: ProfileFormState[K]) =>
    onChange({ ...value, [k]: v });

  const emojisClamped = Math.min(value.messagesWithEmoji, value.messagesSent);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-10"
    >
      <Section title="About you" subtitle="Identity and lifestyle.">
        <Grid>
          <Field label="Age">
            <input
              type="number"
              min={18}
              max={99}
              value={value.age}
              onChange={(e) => set("age", Number(e.target.value))}
              className="field-input"
              required
            />
          </Field>
          <Field label="Gender">
            <Select value={value.gender} onChange={(v) => set("gender", v as never)} options={GENDERS} />
          </Field>
          <Field label="Sexual orientation">
            <Select
              value={value.sexualOrientation}
              onChange={(v) => set("sexualOrientation", v as never)}
              options={SEXUAL_ORIENTATIONS}
            />
          </Field>
          <Field label="Body type">
            <Select
              value={value.bodyType}
              onChange={(v) => set("bodyType", v as never)}
              options={BODY_TYPES}
            />
          </Field>
          <Field label="Location type">
            <Select
              value={value.locationType}
              onChange={(v) => set("locationType", v as never)}
              options={LOCATION_TYPES}
            />
          </Field>
          <Field label="Relationship intent">
            <Select
              value={value.relationshipIntent}
              onChange={(v) => set("relationshipIntent", v as never)}
              options={RELATIONSHIP_INTENTS}
            />
          </Field>
        </Grid>
      </Section>

      <Section title="Your profile" subtitle="How you present on the app.">
        <Field label="Bio">
          <textarea
            value={value.bio}
            onChange={(e) => set("bio", e.target.value)}
            rows={3}
            placeholder="A few lines about you…"
            className="field-input resize-none"
          />
          <p className="field-help">{value.bio.trim().length} characters</p>
        </Field>
      </Section>

      <Section title="Your behavior" subtitle="How you actually use the app.">
        <Grid>
          <Field label="Total mutual matches" help="Across your whole time on the app.">
            <SliderInput
              value={value.mutualMatches}
              min={0}
              max={200}
              step={1}
              onChange={(v) => set("mutualMatches", v)}
            />
          </Field>
          <Field label="Typical swipe time of day">
            <Select
              value={value.swipeTimeOfDay}
              onChange={(v) => set("swipeTimeOfDay", v as never)}
              options={SWIPE_TIMES}
            />
          </Field>
          <Field label="Last-active time" help="Hour you usually last open the app.">
            <input
              type="time"
              value={value.lastActiveTime}
              onChange={(e) => set("lastActiveTime", e.target.value)}
              className="field-input"
            />
          </Field>
          <Field label="Messages sent (last 30 days)">
            <input
              type="number"
              min={0}
              max={1000}
              value={value.messagesSent}
              onChange={(e) => set("messagesSent", Number(e.target.value))}
              className="field-input"
            />
          </Field>
          <Field
            label="…of those, how many used emojis"
            help="We compute your emoji rate from these two numbers."
          >
            <input
              type="number"
              min={0}
              max={value.messagesSent}
              value={emojisClamped}
              onChange={(e) => set("messagesWithEmoji", Number(e.target.value))}
              className="field-input"
            />
          </Field>
        </Grid>
      </Section>

      <div className="flex items-center justify-center pt-2">
        <button type="submit" disabled={busy} className="btn-primary min-w-[200px]">
          {busy ? "Predicting…" : "Predict outcome"}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-5">
        <h2 className="text-[22px] font-semibold tracking-tightest text-ink-light dark:text-ink-dark">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[14px] text-muted-light dark:text-muted-dark mt-0.5">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{children}</div>;
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      <span className="field-label">{label}</span>
      {children}
      {help && <p className="field-help">{help}</p>}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="field-input"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function SliderInput({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-accent"
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="field-input w-24 text-center tabular-nums"
      />
    </div>
  );
}
