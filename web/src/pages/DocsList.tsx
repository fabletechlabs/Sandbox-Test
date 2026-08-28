import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { createDoc, listDocs } from '../api/client';
import type { Doc } from '../types';
import { formatDateTime, useDocumentTitle } from '../utils';

function DocsList() {
  useDocumentTitle('Docs');
  const navigate = useNavigate();

  const [docs, setDocs] = useState<Doc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDocs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listDocs();
      setDocs(data);
    } catch {
      setError('Unable to load docs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError('Enter a title for this doc.');
      return;
    }
    setTitleError(null);
    setIsSubmitting(true);
    try {
      const created = await createDoc({ title: trimmed });
      setTitle('');
      setIsFormOpen(false);
      navigate(`/docs/${created.slug}`);
    } catch {
      setError('Unable to create the doc. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="docs-page">
      <div className="page-header">
        <h1>Docs</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsFormOpen((open) => !open)}
          aria-expanded={isFormOpen}
          aria-controls={isFormOpen ? 'new-doc-form' : undefined}
        >
          {isFormOpen ? 'Cancel' : '+ New doc'}
        </button>
      </div>

      {isFormOpen ? (
        <form id="new-doc-form" className="inline-form" onSubmit={handleSubmit} noValidate aria-label="New doc">
          <div className="field">
            <label htmlFor="doc-title">Title (required)</label>
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-required="true"
              aria-invalid={titleError ? 'true' : 'false'}
              aria-describedby={titleError ? 'doc-title-error' : undefined}
            />
            {titleError ? (
              <p id="doc-title-error" className="field-error">
                {titleError}
              </p>
            ) : null}
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create doc'}
            </button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <p>Loading docs…</p>
      ) : error ? (
        <p role="alert" className="page-error">
          {error}
        </p>
      ) : docs.length === 0 ? (
        <p>No docs yet.</p>
      ) : (
        <ul className="doc-card-list">
          {docs.map((doc) => (
            <li key={doc._id} className="doc-card">
              <h2>
                <Link to={`/docs/${doc.slug}`}>{doc.title}</Link>
              </h2>
              <p className="doc-card-meta">Updated {formatDateTime(doc.updatedAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DocsList;
