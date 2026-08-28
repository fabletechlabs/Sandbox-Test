import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

import { createTicket, updateTicket } from '../api/client';
import { STATUSES, TYPES, getStatusLabel, getTypeLabel } from '../constants';
import type { Epic, Member, Ticket } from '../types';

interface TicketModalProps {
  mode: 'create' | 'edit';
  ticket?: Ticket | null;
  /** Pre-fill the epic field, e.g. when creating a ticket from within an Epic. */
  defaultEpicId?: string | null;
  epics: Epic[];
  members: Member[];
  onClose: () => void;
  onSaved: (ticket: Ticket) => void;
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) {
    return [];
  }
  const selector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/**
 * Reusable create/edit ticket dialog.
 *
 * Accessibility notes:
 * - Rendered via a portal directly under <body>, so it sits outside the
 *   `.app-shell` tree. That lets us mark `.app-shell` `inert` while the
 *   dialog is open (background becomes programmatically unreachable) without
 *   also making the dialog itself inert.
 * - Initial focus goes to the heading (best practice from the Modal Dialog
 *   acceptance criteria); Tab/Shift+Tab is trapped inside; Escape closes;
 *   focus returns to whatever was focused before the dialog opened (the
 *   trigger button in every current usage).
 */
function TicketModal({ mode, ticket = null, defaultEpicId = null, epics, members, onClose, onSaved }: TicketModalProps) {
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState(ticket?.title ?? '');
  const [description, setDescription] = useState(ticket?.description ?? '');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(ticket?.acceptanceCriteria ?? '');
  const [type, setType] = useState<string>(ticket?.type ?? 'story');
  const [status, setStatus] = useState<string>(ticket?.status ?? 'backlog');
  const [estimate, setEstimate] = useState<string>(ticket ? String(ticket.estimate ?? 0) : '0');
  const [epicId, setEpicId] = useState<string>(ticket?.epicId ?? defaultEpicId ?? '');
  const [assignee, setAssignee] = useState<string>(ticket?.assignee ?? '');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const appShell = document.querySelector<HTMLElement>('.app-shell');
    const previouslyFocused = document.activeElement as HTMLElement | null;

    if (appShell) {
      appShell.inert = true;
    }
    document.body.classList.add('modal-open');
    headingRef.current?.focus();

    return () => {
      if (appShell) {
        appShell.inert = false;
      }
      document.body.classList.remove('modal-open');
      previouslyFocused?.focus();
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key === 'Tab') {
      const focusable = getFocusableElements(dialogRef.current);
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Enter a title for this ticket.');
      titleInputRef.current?.focus();
      return;
    }
    setTitleError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    const parsedEstimate = Number(estimate);
    const payload = {
      title: trimmedTitle,
      description,
      acceptanceCriteria,
      type: type as Ticket['type'],
      status,
      estimate: Number.isFinite(parsedEstimate) ? parsedEstimate : 0,
      epicId: epicId || null,
      assignee,
    };

    try {
      const saved =
        mode === 'create' ? await createTicket(payload) : await updateTicket((ticket as Ticket)._id, payload);
      onSaved(saved);
    } catch {
      setSubmitError('Something went wrong saving this ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const headingText = mode === 'create' ? 'New ticket' : `Edit ${ticket?.key ?? 'ticket'}`;

  const dialog = (
    <div className="modal-overlay">
      <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby={headingId} ref={dialogRef} onKeyDown={handleKeyDown}>
        <div className="modal-header">
          <h2 id={headingId} tabIndex={-1} ref={headingRef}>
            {headingText}
          </h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <span aria-hidden="true">×</span>
            <span className="visually-hidden">Close dialog</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          {submitError ? (
            <p className="form-error" role="alert">
              {submitError}
            </p>
          ) : null}

          <div className="field">
            <label htmlFor="ticket-title">Title (required)</label>
            <input
              id="ticket-title"
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-required="true"
              aria-invalid={titleError ? 'true' : 'false'}
              aria-describedby={titleError ? 'ticket-title-error' : undefined}
            />
            {titleError ? (
              <p id="ticket-title-error" className="field-error">
                {titleError}
              </p>
            ) : null}
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="ticket-type">Type</label>
              <select id="ticket-type" value={type} onChange={(event) => setType(event.target.value)}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {getTypeLabel(t)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ticket-status">Status</label>
              <select id="ticket-status" value={status} onChange={(event) => setStatus(event.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {getStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ticket-estimate">Estimate (points)</label>
              <input
                id="ticket-estimate"
                type="number"
                min={0}
                step={1}
                value={estimate}
                onChange={(event) => setEstimate(event.target.value)}
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="ticket-epic">Epic</label>
              <select id="ticket-epic" value={epicId} onChange={(event) => setEpicId(event.target.value)}>
                <option value="">No epic</option>
                {epics.map((epic) => (
                  <option key={epic._id} value={epic._id}>
                    {epic.key} — {epic.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ticket-assignee">Assignee</label>
              <select id="ticket-assignee" value={assignee} onChange={(event) => setAssignee(event.target.value)}>
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member._id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="ticket-description">Description</label>
            <textarea id="ticket-description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="ticket-ac">Acceptance criteria</label>
            <textarea
              id="ticket-ac"
              rows={4}
              value={acceptanceCriteria}
              onChange={(event) => setAcceptanceCriteria(event.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create ticket' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

export default TicketModal;
