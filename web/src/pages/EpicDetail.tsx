import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getEpic, getEpics, getMembers, updateTicket } from '../api/client';
import TicketCard from '../components/TicketCard';
import TicketModal from '../components/TicketModal';
import { STATUSES, getStatusLabel } from '../constants';
import type { Epic, Member, Ticket } from '../types';
import { useDocumentTitle } from '../utils';

const DEFAULT_COLOR = '#2563eb';

function EpicDetail() {
  const { id } = useParams<{ id: string }>();
  const [epic, setEpic] = useState<Epic | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useDocumentTitle(epic ? `${epic.key} — ${epic.title}` : 'Epic');

  const loadData = useCallback(async () => {
    if (!id) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [epicRes, epicsRes, membersRes] = await Promise.all([getEpic(id), getEpics(), getMembers()]);
      setEpic(epicRes.epic);
      setTickets(epicRes.tickets);
      setEpics(epicsRes);
      setMembers(membersRes);
    } catch {
      setError('Unable to load this epic. It may not exist.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const groupedTickets = useMemo(() => {
    const byStatus = new Map<string, Ticket[]>();
    tickets.forEach((ticket) => {
      const list = byStatus.get(ticket.status) ?? [];
      list.push(ticket);
      byStatus.set(ticket.status, list);
    });
    const known = STATUSES.map((status) => ({ status, tickets: byStatus.get(status) ?? [] }));
    const otherStatuses = Array.from(byStatus.keys()).filter((status) => !(STATUSES as readonly string[]).includes(status));
    const otherTickets = otherStatuses.flatMap((status) => byStatus.get(status) ?? []);
    return otherTickets.length > 0 ? [...known, { status: 'other', tickets: otherTickets }] : known;
  }, [tickets]);

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
    return <p>Loading epic…</p>;
  }

  if (error || !epic) {
    return (
      <p role="alert" className="page-error">
        {error ?? 'Epic not found.'}
      </p>
    );
  }

  const epicRef = { _id: epic._id, key: epic.key, title: epic.title, color: epic.color };

  return (
    <div className="epic-detail-page">
      <p className="breadcrumb">
        <Link to="/epics">← All epics</Link>
      </p>
      <div className="page-header">
        <div>
          <h1>
            <span className="epic-card-swatch epic-card-swatch-inline" style={{ backgroundColor: epic.color || DEFAULT_COLOR }} aria-hidden="true" />
            {epic.key} — {epic.title}
          </h1>
          <span className="epic-status-label">Status: {epic.status === 'done' ? 'Done' : 'Open'}</span>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + New ticket in this epic
        </button>
      </div>

      {epic.description ? <p className="epic-detail-description">{epic.description}</p> : null}

      <div className="epic-ticket-groups">
        {groupedTickets.map((group) => (
          <section className="board-column" key={group.status}>
            <h2>{group.status === 'other' ? 'Other' : getStatusLabel(group.status)}</h2>
            <ul className="ticket-list">
              {group.tickets.length === 0 ? (
                <li className="ticket-list-empty">No tickets</li>
              ) : (
                group.tickets.map((ticket) => (
                  <TicketCard key={ticket._id} ticket={ticket} epic={epicRef} members={members} onStatusChange={handleStatusChange} />
                ))
              )}
            </ul>
          </section>
        ))}
      </div>

      {isModalOpen ? (
        <TicketModal
          mode="create"
          defaultEpicId={epic._id}
          epics={epics}
          members={members}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleTicketSaved}
        />
      ) : null}
    </div>
  );
}

export default EpicDetail;
