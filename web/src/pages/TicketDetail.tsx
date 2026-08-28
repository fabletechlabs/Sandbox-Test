import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { addComment, deleteTicket, getEpics, getMembers, getTicket, updateTicket } from '../api/client';
import EpicBadge from '../components/EpicBadge';
import { STATUSES, TYPES, getStatusLabel, getTypeLabel } from '../constants';
import type { Comment, Epic, Member, Ticket } from '../types';
import { formatDateTime, useDocumentTitle } from '../utils';

function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useDocumentTitle(ticket ? `${ticket.key}: ${ticket.title}` : 'Ticket');

  // Edit form state, seeded from the loaded ticket.
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [type, setType] = useState('story');
  const [status, setStatus] = useState('backlog');
  const [estimate, setEstimate] = useState('0');
  const [epicId, setEpicId] = useState('');
  const [assignee, setAssignee] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Add-comment form state.
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isCommenting, setIsCommenting] = useState(false);

  function populateForm(loaded: Ticket) {
    setTitle(loaded.title);
    setDescription(loaded.description ?? '');
    setAcceptanceCriteria(loaded.acceptanceCriteria ?? '');
    setType(loaded.type);
    setStatus(loaded.status);
    setEstimate(String(loaded.estimate ?? 0));
    setEpicId(loaded.epicId ?? '');
    setAssignee(loaded.assignee ?? '');
  }

  const loadData = useCallback(async () => {
    if (!id) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [detail, epicsRes, membersRes] = await Promise.all([getTicket(id), getEpics(), getMembers()]);
      setTicket(detail.ticket);
      setComments(detail.comments);
      setEpics(epicsRes);
      setMembers(membersRes);
      populateForm(detail.ticket);
    } catch {
      setError('Unable to load this ticket. It may not exist.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentEpic = useMemo(() => epics.find((e) => e._id === epicId) ?? null, [epics, epicId]);
  const statusIsKnown = (STATUSES as readonly string[]).includes(status);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticket) {
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Enter a title for this ticket.');
      return;
    }
    setTitleError(null);
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const parsedEstimate = Number(estimate);
      const updated = await updateTicket(ticket._id, {
        title: trimmedTitle,
        description,
        acceptanceCriteria,
        type: type as Ticket['type'],
        status,
        estimate: Number.isFinite(parsedEstimate) ? parsedEstimate : 0,
        epicId: epicId || null,
        assignee,
      });
      setTicket(updated);
      setSaveMessage('Changes saved.');
    } catch {
      setError('Unable to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!ticket) {
      return;
    }
    const confirmed = window.confirm(`Delete ${ticket.key}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }
    try {
      await deleteTicket(ticket._id);
      navigate('/backlog');
    } catch {
      setError('Unable to delete this ticket. Please try again.');
    }
  }

  async function handleAddComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticket) {
      return;
    }
    const trimmedAuthor = commentAuthor.trim();
    const trimmedBody = commentBody.trim();
    if (!trimmedAuthor || !trimmedBody) {
      setCommentError('Enter your name and a comment before posting.');
      return;
    }
    setCommentError(null);
    setIsCommenting(true);
    try {
      const comment = await addComment(ticket._id, { author: trimmedAuthor, body: trimmedBody });
      setComments((prev) => [...prev, comment]);
      setCommentBody('');
    } catch {
      setCommentError('Unable to post this comment. Please try again.');
    } finally {
      setIsCommenting(false);
    }
  }

  if (isLoading) {
    return <p>Loading ticket…</p>;
  }

  if (error || !ticket) {
    return (
      <p role="alert" className="page-error">
        {error ?? 'Ticket not found.'}
      </p>
    );
  }

  return (
    <div className="ticket-detail-page">
      <p className="breadcrumb">
        <Link to="/backlog">← Back to backlog</Link>
      </p>

      <div className="page-header">
        <div>
          <h1>
            {ticket.key}: {ticket.title}
          </h1>
          <div className="ticket-detail-meta">
            <span className={`type-badge type-badge-${ticket.type}`}>{getTypeLabel(ticket.type)}</span>
            <span className="status-badge">{getStatusLabel(ticket.status)}</span>
            <EpicBadge epic={currentEpic} />
          </div>
        </div>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>
          Delete ticket
        </button>
      </div>

      <form className="ticket-edit-form" onSubmit={handleSave} noValidate aria-label="Edit ticket">
        <h2>Details</h2>
        {saveMessage ? (
          <p role="status" className="form-success">
            {saveMessage}
          </p>
        ) : null}
        <div className="field">
          <label htmlFor="detail-title">Title (required)</label>
          <input
            id="detail-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-required="true"
            aria-invalid={titleError ? 'true' : 'false'}
            aria-describedby={titleError ? 'detail-title-error' : undefined}
          />
          {titleError ? (
            <p id="detail-title-error" className="field-error">
              {titleError}
            </p>
          ) : null}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="detail-type">Type</label>
            <select id="detail-type" value={type} onChange={(event) => setType(event.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {getTypeLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="detail-status">Status</label>
            <select id="detail-status" value={status} onChange={(event) => setStatus(event.target.value)}>
              {!statusIsKnown ? <option value={status}>{getStatusLabel(status)}</option> : null}
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {getStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="detail-estimate">Estimate (points)</label>
            <input id="detail-estimate" type="number" min={0} step={1} value={estimate} onChange={(event) => setEstimate(event.target.value)} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="detail-epic">Epic</label>
            <select id="detail-epic" value={epicId} onChange={(event) => setEpicId(event.target.value)}>
              <option value="">No epic</option>
              {epics.map((epic) => (
                <option key={epic._id} value={epic._id}>
                  {epic.key} — {epic.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="detail-assignee">Assignee</label>
            <select id="detail-assignee" value={assignee} onChange={(event) => setAssignee(event.target.value)}>
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
          <label htmlFor="detail-description">Description</label>
          <textarea id="detail-description" rows={5} value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="detail-ac">Acceptance criteria</label>
          <textarea id="detail-ac" rows={5} value={acceptanceCriteria} onChange={(event) => setAcceptanceCriteria(event.target.value)} />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <section className="comments-section">
        <h2>Comments</h2>
        {comments.length === 0 ? (
          <p>No comments yet.</p>
        ) : (
          <ul className="comment-list">
            {comments.map((comment) => (
              <li key={comment._id} className="comment-item">
                <div className="comment-meta">
                  <span className="comment-author">{comment.author}</span>
                  <span className="comment-date">{formatDateTime(comment.createdAt)}</span>
                </div>
                <p className="comment-body">{comment.body}</p>
              </li>
            ))}
          </ul>
        )}

        <form className="comment-form" onSubmit={handleAddComment} noValidate aria-label="Add a comment">
          {commentError ? (
            <p role="alert" className="form-error">
              {commentError}
            </p>
          ) : null}
          <div className="field">
            <label htmlFor="comment-author">Your name</label>
            <input id="comment-author" type="text" value={commentAuthor} onChange={(event) => setCommentAuthor(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="comment-body">Comment</label>
            <textarea id="comment-body" rows={3} value={commentBody} onChange={(event) => setCommentBody(event.target.value)} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-secondary" disabled={isCommenting}>
              {isCommenting ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default TicketDetail;
