import { useEffect, useState } from 'react';

import { getDevStats, resetToSampleData, seedLargeDataset } from '../api/client';
import { useDocumentTitle } from '../utils';

/**
 * A small tools page (not linked from the nav) for reseeding the database on
 * demand: load a large dataset so the board is slow, or reset to sample data.
 */
function Dev() {
  useDocumentTitle('Data tools');

  const [ticketCount, setTicketCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshCount() {
    try {
      const { tickets } = await getDevStats();
      setTicketCount(tickets);
    } catch {
      setTicketCount(null);
    }
  }

  useEffect(() => {
    refreshCount();
  }, []);

  async function run(
    action: () => Promise<{ tickets: number }>,
    doneMessage: (n: number) => string
  ) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { tickets } = await action();
      setTicketCount(tickets);
      setMessage(doneMessage(tickets));
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1>Data tools</h1>
      <p>
        Reseed the database on demand. Loading the large dataset inserts thousands of tickets so
        the board is noticeably slow; resetting returns it to the small sample set.
      </p>

      <p>
        Current tickets: <strong>{ticketCount === null ? '—' : ticketCount.toLocaleString()}</strong>
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', margin: '1rem 0' }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={() =>
            run(
              seedLargeDataset,
              (n) => `Loaded the large dataset: ${n.toLocaleString()} tickets. The board will be slow now.`
            )
          }
        >
          {busy ? 'Working…' : 'Load large dataset (5,000 tickets)'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy}
          onClick={() =>
            run(resetToSampleData, (n) => `Reset to sample data: ${n.toLocaleString()} tickets.`)
          }
        >
          {busy ? 'Working…' : 'Reset to sample data'}
        </button>
      </div>

      <p role="status" aria-live="polite" style={{ minHeight: '1.25rem' }}>
        {message}
      </p>
      {error ? (
        <p role="alert" className="page-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default Dev;
