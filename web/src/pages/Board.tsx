import { useCallback, useEffect, useMemo, useState } from 'react';

import { getBoard, getEpics, getMembers, updateTicket } from '../api/client';
import EpicBadge from '../components/EpicBadge';
import ProgressBar from '../components/ProgressBar';
import TicketCard from '../components/TicketCard';
import TicketModal from '../components/TicketModal';
import { STATUSES, getStatusLabel } from '../constants';
import type { BoardColumn, Epic, Member } from '../types';
import { useDocumentTitle } from '../utils';

type NamedColumn = BoardColumn & { status: string };

function Board() {
  useDocumentTitle('Board');
  const [columns, setColumns] = useState<NamedColumn[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [boardRes, epicsRes, membersRes] = await Promise.all([getBoard(), getEpics(), getMembers()]);
      setColumns(boardRes.columns);
      setEpics(epicsRes);
      setMembers(membersRes);
    } catch {
      setError('Unable to load the board. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Columns in the fixed STATUSES order; anything else (e.g. seed data with
  // status 'blocked') is grouped into a single trailing "Other" column.
  const orderedColumns = useMemo(() => {
    const byStatus = new Map(columns.map((col) => [col.status, col]));
    const known = STATUSES.map((status) => ({
      status,
      tickets: byStatus.get(status)?.tickets ?? [],
    }));
    const otherTickets = columns
      .filter((col) => !(STATUSES as readonly string[]).includes(col.status))
      .flatMap((col) => col.tickets);
    return otherTickets.length > 0 ? [...known, { status: 'other', tickets: otherTickets }] : known;
  }, [columns]);

  // Deliberately computed here from the board's own ticket list rather than
  // trusting epic.stats/epic.progress from GET /epics — those can disagree
  // with what's actually on the board right now.
  const epicProgress = useMemo(() => {
    const totals = new Map<string, { total: number; done: number }>();
    columns.forEach((column) => {
      column.tickets.forEach((ticket) => {
        if (!ticket.epic) {
          return;
        }
        const entry = totals.get(ticket.epic._id) ?? { total: 0, done: 0 };
        entry.total += 1;
        if (column.status === 'done') {
          entry.done += 1;
        }
        totals.set(ticket.epic._id, entry);
      });
    });
    return totals;
  }, [columns]);

  async function handleStatusChange(ticketId: string, status: string) {
    try {
      await updateTicket(ticketId, { status });
      await loadData();
    } catch {
      setError('Unable to update ticket status. Please try again.');
    }
  }

  function handleTicketSaved() {
    setIsModalOpen(false);
    loadData();
  }

  if (isLoading) {
    return <p>Loading board…</p>;
  }

  if (error) {
    return (
      <p role="alert" className="page-error">
        {error}
      </p>
    );
  }

  return (
    <div className="board-page">
      <div className="page-header">
        <h1>Board</h1>
        <button type="button" className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + New ticket
        </button>
      </div>

      <div className="board-layout">
        <div className="board-columns">
          {orderedColumns.map((column) => (
            <section className="board-column" key={column.status}>
              <h2>{column.status === 'other' ? 'Other' : getStatusLabel(column.status)}</h2>
              <ul className="ticket-list">
                {column.tickets.length === 0 ? (
                  <li className="ticket-list-empty">No tickets</li>
                ) : (
                  column.tickets.map((ticket) => (
                    <TicketCard
                      key={ticket._id}
                      ticket={ticket}
                      epic={ticket.epic}
                      members={members}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </ul>
            </section>
          ))}
        </div>

        <aside aria-label="Epics" className="board-sidebar">
          <h2>Epics</h2>
          {epics.length === 0 ? (
            <p>No epics yet.</p>
          ) : (
            <ul className="epic-progress-list">
              {epics.map((epic) => {
                const progress = epicProgress.get(epic._id);
                const total = progress?.total ?? 0;
                const done = progress?.done ?? 0;
                const percent = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <li key={epic._id} className="epic-progress-item">
                    <EpicBadge epic={epic} />
                    <ProgressBar value={percent} label={`${epic.title}: ${done} of ${total} tickets done`} />
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>

      {isModalOpen ? (
        <TicketModal mode="create" epics={epics} members={members} onClose={() => setIsModalOpen(false)} onSaved={handleTicketSaved} />
      ) : null}
    </div>
  );
}

export default Board;
