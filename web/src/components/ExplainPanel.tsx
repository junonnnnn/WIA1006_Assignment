import { useState } from "react";
import type { ExplanationEntry, FeatureMeta } from "../types";

interface Props {
  topClass: string;
  entries: ExplanationEntry[];
  meta: FeatureMeta;
}

export function ExplainPanel({ topClass, entries, meta }: Props) {
  const top5 = entries.slice(0, 5);
  const maxAbs = Math.max(...top5.map((e) => Math.abs(e.delta)), 0.0001);
  const [openGlobal, setOpenGlobal] = useState(false);

  return (
    <section className="card p-8 sm:p-10 space-y-8">
      <header>
        <p className="text-[13px] uppercase tracking-[0.08em] text-muted-light dark:text-muted-dark">
          Why this prediction
        </p>
        <h3 className="text-[24px] font-semibold tracking-tightest text-ink-light dark:text-ink-dark mt-1">
          Top factors for “{topClass}”
        </h3>
        <p className="text-[14px] text-muted-light dark:text-muted-dark mt-2">
          How much each input pushed the model toward or away from this outcome,
          measured by swapping it for the dataset baseline and re-running.
        </p>
      </header>

      <ul className="space-y-4">
        {top5.map((e) => {
          const supports = e.delta > 0;
          // Bars grow from the centerline outward, so max usable width is 50%
          // of the track on either side.
          const widthPct = Math.min(50, (Math.abs(e.delta) / maxAbs) * 50);
          const width = `${widthPct.toFixed(2)}%`;
          return (
            <li
              key={e.field}
              className="grid grid-cols-[180px_1fr_56px] items-center gap-3"
            >
              <span className="text-[14px] text-ink-light dark:text-ink-dark">
                {e.label}
              </span>
              <div className="relative h-1.5 rounded-full bg-hairline-light dark:bg-hairline-dark overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 rounded-full"
                  style={{
                    width,
                    left: supports ? "50%" : undefined,
                    right: supports ? undefined : "50%",
                    background: supports ? "#30d158" : "#ff453a",
                    transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-muted-light/40 dark:bg-muted-dark/40" />
              </div>
              <span className="text-[13px] tabular-nums text-muted-light dark:text-muted-dark text-right">
                {(e.delta * 100).toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>

      <div>
        <button
          type="button"
          onClick={() => setOpenGlobal((x) => !x)}
          className="text-[14px] text-accent hover:underline transition-colors"
          aria-expanded={openGlobal}
        >
          {openGlobal ? "Hide" : "About the model"}
        </button>
        {openGlobal && (
          <div className="mt-4 text-[14px] text-muted-light dark:text-muted-dark space-y-3">
            <p>
              The model is a LightGBM classifier with 300 boosted trees trained
              on 50 000 anonymized dating-app sessions. It runs entirely in your
              browser via ONNX — no data leaves your device.
            </p>
            <p>
              Below are the model’s <em>global</em> feature importances (total
              splits across all trees). These reflect how often the model uses a
              feature overall, which can differ from how that feature affected
              your specific prediction.
            </p>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1 pt-2 tabular-nums text-[13px]">
              {Object.entries(meta.global_importances)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([name, imp]) => (
                  <li key={name} className="flex justify-between gap-3">
                    <span className="truncate">{name}</span>
                    <span>{imp.toLocaleString()}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
