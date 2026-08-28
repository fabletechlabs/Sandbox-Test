import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { createEpic, getEpics } from '../api/client';
import ProgressBar from '../components/ProgressBar';
import type { Epic } from '../types';
import { useDocumentTitle } from '../utils';

const DEFAULT_COLOR = '#2563eb';

function Epics() {
  useDocumentTitle('Epics');
  const [epics, setEpics] = useState<Epic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEpics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEpics();
      setEpics(data);
    } catch {
      setError('Unable to load epics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEpics();
  }, [loadEpics]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError('Enter a title for this epic.');
      return;
    }
    setTitleError(null);
    setIsSubmitting(true);
    try {
      await createEpic({ title: trimmed, description, color });
      setTitle('');
      setDescription('');
      setColor(DEFAULT_COLOR);
      setIsFormOpen(false);
      await loadEpics();
    } catch {
      setError('Unable to create the epic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="epics-page">
      <div className="page-header">
        <h1>Epics</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsFormOpen((open) => !open)}
          aria-expanded={isFormOpen}
          aria-controls="new-epic-form"
        >
          {isFormOpen ? 'Cancel' : '+ New epic'}
        </button>
      </div>

      {isFormOpen ? (
        <form id="new-epic-form" className="inline-form" onSubmit={handleSubmit} noValidate aria-label="New epic">
          <div className="field">
            <label htmlFor="epic-title">Title (required)</label>
            <input
              id="epic-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-required="true"
              aria-invalid={titleError ? 'true' : 'false'}
              aria-describedby={titleError ? 'epic-title-error' : undefined}
            />
            {titleError ? (
              <p id="epic-title-error" className="field-error">
                {titleError}
              </p>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="epic-description">Description</label>
            <textarea id="epic-description" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="epic-color">Colour</label>
            <input id="epic-color" type="color" value={color} onChange={(event) => setColor(event.target.value)} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create epic'}
            </button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <p>Loading epics…</p>
      ) : error ? (
        <p role="alert" className="page-error">
          {error}
        </p>
      ) : epics.length === 0 ? (
        <p>No epics yet.</p>
      ) : (
        <ul className="epic-card-list">
          {epics.map((epic) => {
            const total = epic.stats?.total ?? 0;
            const done = epic.stats?.done ?? 0;
            const percent = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <li key={epic._id} className="epic-card">
                <span className="epic-card-swatch" style={{ backgroundColor: epic.color || DEFAULT_COLOR }} aria-hidden="true" />
                <div className="epic-card-body">
                  <h2>
                    <Link to={`/epics/${epic._id}`}>
                      {epic.key} — {epic.title}
                    </Link>
                  </h2>
                  {epic.description ? <p className="epic-card-description">{epic.description}</p> : null}
                  <ProgressBar value={percent} label={`${epic.title}: ${done} of ${total} tickets done`} />
                  <span className="epic-status-label">Status: {epic.status === 'done' ? 'Done' : 'Open'}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Epics;
