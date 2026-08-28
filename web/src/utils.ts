import { useEffect } from 'react';

import type { Epic, Member } from './types';

/**
 * Tickets store `assignee` as a member name (or empty when unassigned).
 * Kept as a helper so the "Unassigned" fallback lives in one place.
 */
export function getMemberName(_members: Member[], assignee: string | null | undefined): string {
  return assignee ? assignee : 'Unassigned';
}

/**
 * Resolve an epicId to a short display label, tolerant of null epicId or an
 * epicId that no longer matches any known epic.
 */
export function getEpicLabel(epics: Epic[], epicId: string | null | undefined): string {
  if (!epicId) {
    return 'No epic';
  }
  const epic = epics.find((e) => e._id === epicId);
  return epic ? `${epic.key} — ${epic.title}` : 'Unknown epic';
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

/**
 * Keeps <title> accurate and unique per page/view (WCAG 2.4.2 Page Titled).
 * This is a single-page app, so the static <title> in index.html only covers
 * the very first paint — each route needs to set its own from here on.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · Cardboard` : 'Cardboard';
    return () => {
      document.title = previous;
    };
  }, [title]);
}
