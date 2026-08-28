interface ProgressBarProps {
  /** 0-100 */
  value: number;
  /** Accessible label describing what this bar measures, e.g. "Onboarding: 3 of 5 tickets done" */
  label: string;
}

/**
 * Uses the native <progress> element rather than a div+role="progressbar" —
 * it has built-in semantics (role, valuenow/min/max) so no extra ARIA is
 * needed beyond the accessible label. The visible "%" text next to it is
 * aria-hidden to avoid the value being announced twice.
 */
function ProgressBar({ value, label }: ProgressBarProps) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const clamped = Math.max(0, Math.min(100, Math.round(safeValue)));

  return (
    <div className="progress-bar-wrapper">
      <progress className="progress-bar" value={clamped} max={100} aria-label={label}>
        {clamped}%
      </progress>
      <span className="progress-bar-text" aria-hidden="true">
        {clamped}%
      </span>
    </div>
  );
}

export default ProgressBar;
