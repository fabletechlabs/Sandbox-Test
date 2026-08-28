interface EpicBadgeEpic {
  key?: string;
  title: string;
  color?: string;
}

interface EpicBadgeProps {
  epic: EpicBadgeEpic | null;
}

const FALLBACK_COLOR = '#94a3b8';

/**
 * Small chip showing which epic a ticket belongs to. The colour swatch is
 * decorative only (aria-hidden) — the epic key/title text label is always
 * present too, so meaning never depends on colour alone.
 */
function EpicBadge({ epic }: EpicBadgeProps) {
  if (!epic) {
    return <span className="epic-badge epic-badge-none">No epic</span>;
  }

  const label = epic.key ? `${epic.key} · ${epic.title}` : epic.title;

  return (
    <span className="epic-badge">
      <span
        className="epic-swatch"
        style={{ backgroundColor: epic.color || FALLBACK_COLOR }}
        aria-hidden="true"
      />
      <span className="epic-badge-label">{label}</span>
    </span>
  );
}

export default EpicBadge;
