// NOTE: this deliberately duplicates the backend's constants — that duplication
// is an intentional teaching point (frontend and backend evolve independently
// and must be kept in sync by hand). Keep it, do not try to share it.

export const STATUSES = ['backlog', 'todo', 'in_progress', 'in_review', 'done'] as const;

export const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

export const TYPES = ['story', 'bug', 'task'] as const;

export const TYPE_LABELS: Record<string, string> = {
  story: 'Story',
  bug: 'Bug',
  task: 'Task',
};

/**
 * Seed data may contain statuses outside STATUSES (e.g. 'blocked'). Render
 * those gracefully instead of crashing or showing "undefined".
 */
export function getStatusLabel(status: string): string {
  if (STATUS_LABELS[status]) {
    return STATUS_LABELS[status];
  }
  if (!status) {
    return 'Unknown';
  }
  return status
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getTypeLabel(type: string): string {
  if (TYPE_LABELS[type]) {
    return TYPE_LABELS[type];
  }
  if (!type) {
    return 'Unknown';
  }
  return type.charAt(0).toUpperCase() + type.slice(1);
}
