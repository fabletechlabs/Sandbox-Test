import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { deleteDoc, getDoc, updateDoc } from '../api/client';
import MarkdownContent from '../components/MarkdownContent';
import type { Doc } from '../types';
import { formatDateTime, useDocumentTitle } from '../utils';

function DocView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<Doc | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // The Edit/Cancel toggle button stays mounted in both modes (see render
  // below) specifically so focus can be returned to it when the edit form
  // closes, instead of being lost when the form it was inside unmounts.
  const editToggleRef = useRef<HTMLButtonElement>(null);

  useDocumentTitle(doc ? doc.title : 'Doc');

  function populateForm(loaded: Doc) {
    setTitle(loaded.title);
    setBody(loaded.body);
  }

  const loadDoc = useCallback(async () => {
    if (!slug) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { doc: loaded } = await getDoc(slug);
      setDoc(loaded);
      populateForm(loaded);
    } catch {
      setError('Unable to load this doc. It may not exist.');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadDoc();
  }, [loadDoc]);

  function handleStartEdit() {
    if (doc) {
      populateForm(doc);
    }
    setTitleError(null);
    setSaveMessage(null);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    if (doc) {
      populateForm(doc);
    }
    setTitleError(null);
    setIsEditing(false);
    editToggleRef.current?.focus();
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!doc) {
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Enter a title for this doc.');
      return;
    }
    setTitleError(null);
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const updated = await updateDoc(doc._id, { title: trimmedTitle, body });
      setDoc(updated);
      setSaveMessage('Changes saved.');
      setIsEditing(false);
      editToggleRef.current?.focus();
    } catch {
      setError('Unable to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!doc) {
      return;
    }
    const confirmed = window.confirm(`Delete "${doc.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }
    try {
      await deleteDoc(doc._id);
      navigate('/docs');
    } catch {
      setError('Unable to delete this doc. Please try again.');
    }
  }

  if (isLoading) {
    return <p>Loading doc…</p>;
  }

  if (error || !doc) {
    return (
      <p role="alert" className="page-error">
        {error ?? 'Doc not found.'}
      </p>
    );
  }

  return (
    <div className="doc-page">
      <p className="breadcrumb">
        <Link to="/docs">← Back to docs</Link>
      </p>

      <div className="page-header">
        <div>
          <h1>{doc.title}</h1>
          <p className="doc-meta">Updated {formatDateTime(doc.updatedAt)}</p>
        </div>
        <button
          ref={editToggleRef}
          type="button"
          className="btn btn-secondary"
          onClick={() => (isEditing ? handleCancelEdit() : handleStartEdit())}
          aria-expanded={isEditing}
          aria-controls={isEditing ? 'doc-edit-form' : undefined}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {saveMessage && !isEditing ? (
        <p role="status" className="form-success">
          {saveMessage}
        </p>
      ) : null}

      {isEditing ? (
        <form id="doc-edit-form" className="ticket-edit-form" onSubmit={handleSave} noValidate aria-label="Edit doc">
          <div className="field">
            <label htmlFor="doc-edit-title">Title (required)</label>
            <input
              id="doc-edit-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-required="true"
              aria-invalid={titleError ? 'true' : 'false'}
              aria-describedby={titleError ? 'doc-edit-title-error' : undefined}
            />
            {titleError ? (
              <p id="doc-edit-title-error" className="field-error">
                {titleError}
              </p>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="doc-edit-body">Body (Markdown)</label>
            <textarea
              id="doc-edit-body"
              rows={16}
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleCancelEdit} disabled={isSaving}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={isSaving}>
              Delete doc
            </button>
          </div>
        </form>
      ) : (
        <MarkdownContent markdown={doc.body} />
      )}
    </div>
  );
}

export default DocView;
