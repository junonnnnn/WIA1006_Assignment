import { OUTCOME_DESCRIPTIONS, OUTCOME_EMOJI } from "../lib/constants";
import { ProbabilityBars } from "./ProbabilityBars";
import type { PredictionResult } from "../types";

interface Props {
  result: PredictionResult;
  classLabels: string[];
  onShare: () => void;
  copied: boolean;
}

export function ResultCard({ result, classLabels, onShare, copied }: Props) {
  const label = result.topLabel;
  const topProb = result.probs[result.topIdx];

  return (
    <section
      aria-live="polite"
      className="card p-8 sm:p-10 space-y-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none"
    >
      <header className="flex items-start gap-5">
        <span
          aria-hidden="true"
          className="text-5xl leading-none select-none"
          style={{ fontFamily: "Apple Color Emoji, Segoe UI Emoji, sans-serif" }}
        >
          {OUTCOME_EMOJI[label] ?? "•"}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] uppercase tracking-[0.08em] text-muted-light dark:text-muted-dark">
            Predicted outcome
          </p>
          <h2 className="text-[36px] sm:text-[44px] font-semibold tracking-tightest text-ink-light dark:text-ink-dark leading-tight">
            {label}
          </h2>
          <p className="text-[16px] text-muted-light dark:text-muted-dark mt-2">
            {OUTCOME_DESCRIPTIONS[label] ?? ""}
          </p>
          <p className="text-[14px] text-muted-light dark:text-muted-dark mt-3 tabular-nums">
            Model confidence: <span className="font-medium text-ink-light dark:text-ink-dark">{(topProb * 100).toFixed(1)}%</span>
          </p>
        </div>
        <button type="button" onClick={onShare} className="btn-ghost shrink-0">
          {copied ? "Copied" : "Share"}
        </button>
      </header>

      <div>
        <h3 className="text-[14px] font-medium text-muted-light dark:text-muted-dark mb-4">
          All ten outcomes
        </h3>
        <ProbabilityBars
          labels={classLabels}
          probs={result.probs}
          topIdx={result.topIdx}
        />
      </div>
    </section>
  );
}
