import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProfileForm } from "./components/ProfileForm";
import { ResultCard } from "./components/ResultCard";
import { ExplainPanel } from "./components/ExplainPanel";
import { ThemeToggle } from "./components/ThemeToggle";
import { encodeFeatures } from "./lib/encodeFeatures";
import { explainPrediction } from "./lib/explain";
import { getMeta, predict, warmup } from "./lib/inference";
import { fullShareUrl, readHash, writeHash } from "./lib/shareUrl";
import type {
  ExplanationEntry,
  FeatureMeta,
  PredictionResult,
  ProfileForm as ProfileFormState,
} from "./types";

const DEFAULT_FORM: ProfileFormState = {
  age: 28,
  mutualMatches: 12,
  bio: "Coffee, climbing, and long walks through art museums. Looking for someone curious.",
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

export default function App() {
  const [form, setForm] = useState<ProfileFormState>(() => readHash() ?? DEFAULT_FORM);
  const [meta, setMeta] = useState<FeatureMeta | null>(null);
  const [busy, setBusy] = useState(false);
  const [warming, setWarming] = useState(true);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [explanation, setExplanation] = useState<ExplanationEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const hadHash = useRef<boolean>(!!readHash());

  // Kick off model + meta load on mount.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await warmup();
        const m = await getMeta();
        if (mounted) setMeta(m);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (mounted) setWarming(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Keep URL hash in sync with the form so shared links round-trip.
  useEffect(() => {
    writeHash(form);
  }, [form]);

  const runPrediction = useCallback(async () => {
    if (!meta) return;
    setBusy(true);
    setError(null);
    try {
      const feats = encodeFeatures(form, meta);
      const r = await predict(feats);
      setResult(r);
      // Compute explanation in the background — don't block the result render.
      explainPrediction(form, meta, r)
        .then(setExplanation)
        .catch((e) => console.error("explain failed", e));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [form, meta]);

  // If we landed with a hash, auto-run once the model is ready.
  useEffect(() => {
    if (meta && hadHash.current && !result && !busy) {
      hadHash.current = false;
      void runPrediction();
    }
  }, [meta, result, busy, runPrediction]);

  // Scroll to the result on first reveal.
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const onShare = useCallback(async () => {
    const url = fullShareUrl(form);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback: just update the hash (already in URL anyway)
      window.prompt("Copy this URL", url);
    }
  }, [form]);

  const ready = !!meta && !warming;

  const heroSub = useMemo(() => {
    if (warming) return "Loading the model…";
    if (error) return error;
    return "An on-device prediction of your most likely match outcome.";
  }, [warming, error]);

  return (
    <div className="min-h-full flex flex-col">
      <nav className="sticky top-0 z-10 backdrop-blur-xl bg-surface-light/72 dark:bg-surface-dark/72 border-b border-hairline-light/60 dark:border-hairline-dark/60">
        <div className="max-w-container mx-auto px-6 h-12 flex items-center justify-between">
          <span className="text-[14px] font-medium tracking-tight text-ink-light dark:text-ink-dark">
            Match Outcome Predictor
          </span>
          <ThemeToggle />
        </div>
      </nav>

      <main className="flex-1 max-w-container mx-auto w-full px-6 pt-16 pb-24 space-y-16">
        <header className="text-center space-y-4">
          <h1 className="text-[44px] sm:text-[56px] font-semibold tracking-tightest text-ink-light dark:text-ink-dark leading-[1.05]">
            Predict your match outcome.
          </h1>
          <p
            className={
              "text-[19px] " +
              (error
                ? "text-red-500"
                : "text-muted-light dark:text-muted-dark")
            }
          >
            {heroSub}
          </p>
        </header>

        <ProfileForm
          value={form}
          onChange={setForm}
          onSubmit={runPrediction}
          busy={busy || !ready}
        />

        <div ref={resultRef} className="space-y-10 scroll-mt-16">
          {result && meta && (
            <ResultCard
              result={result}
              classLabels={meta.class_labels}
              onShare={onShare}
              copied={copied}
            />
          )}
          {result && meta && explanation && (
            <ExplainPanel topClass={result.topLabel} entries={explanation} meta={meta} />
          )}
        </div>
      </main>

      <footer className="max-w-container mx-auto w-full px-6 pb-10">
        <p className="text-[12px] text-muted-light dark:text-muted-dark text-center">
          Inference runs entirely in your browser. No data is uploaded.
        </p>
      </footer>
    </div>
  );
}
