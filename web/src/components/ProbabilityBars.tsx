interface Props {
  labels: string[];
  probs: number[];
  topIdx: number;
}

export function ProbabilityBars({ labels, probs, topIdx }: Props) {
  const rows = labels
    .map((label, i) => ({ label, prob: probs[i], i }))
    .sort((a, b) => b.prob - a.prob);

  return (
    <ul className="space-y-3">
      {rows.map(({ label, prob, i }) => (
        <li key={label} className="grid grid-cols-[140px_1fr_56px] items-center gap-3 sm:grid-cols-[180px_1fr_64px]">
          <span
            className={
              "text-[14px] " +
              (i === topIdx
                ? "font-semibold text-ink-light dark:text-ink-dark"
                : "text-muted-light dark:text-muted-dark")
            }
          >
            {label}
          </span>
          <div className="h-1.5 rounded-full bg-hairline-light dark:bg-hairline-dark overflow-hidden">
            <div
              className="prob-bar"
              style={{
                width: `${(prob * 100).toFixed(2)}%`,
                opacity: i === topIdx ? 1 : 0.45,
              }}
            />
          </div>
          <span className="text-[13px] tabular-nums text-muted-light dark:text-muted-dark text-right">
            {(prob * 100).toFixed(1)}%
          </span>
        </li>
      ))}
    </ul>
  );
}
