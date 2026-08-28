import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getEpics, getMembers, getTickets } from '../api/client';
import TicketModal from '../components/TicketModal';
import { STATUSES, getStatusLabel, getTypeLabel } from '../constants';
import type { Epic, Member, Ticket } from '../types';
import { getEpicLabel, getMemberName, useDocumentTitle } from '../utils';

function Backlog() {
  useDocumentTitle('Backlog');
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [epicFilter, setEpicFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTickets({
        status: statusFilter || undefined,
        epicId: epicFilter || undefined,
      });
      setTickets(data);
    } catch {
      setError('Unable to load tickets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, epicFilter]);

  useEffect(() => {
    (async () => {
      try {
        const [epicsRes, membersRes] = await Promise.all([getEpics(), getMembers()]);
        setEpics(epicsRes);
        setMembers(membersRes);
      } catch {
        setError('Unable to load epics or members.');
      }
    })();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  function handleTicketSaved() {
    setIsModalOpen(false);
    loadTickets();
  }

  return (
    <div className="backlog-page">
      <div className="page-header">
        <h1>Backlog</h1>
        <button type="button" className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + New ticket
        </button>
      </div>

      <div className="filters">
        <div className="field field-inline">
          <label htmlFor="filter-status">Filter by status</label>
          <select id="filter-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
        <div className="field field-inline">
          <label htmlFor="filter-epic">Filter by epic</label>
          <select id="filter-epic" value={epicFilter} onChange={(event) => setEpicFilter(event.target.value)}>
            <option value="">All epics</option>
            {epics.map((epic) => (
              <option key={epic._id} value={epic._id}>
                {epic.key} — {epic.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <p>Loading tickets…</p>
      ) : error ? (
        <p role="alert" className="page-error">
          {error}
        </p>
      ) : tickets.length === 0 ? (
        <p>No tickets match these filters.</p>
      ) : (
        <div className="table-scroll">
          <table className="backlog-table">
            <caption className="visually-hidden">Tickets in the backlog</caption>
            <thead>
              <tr>
                <th scope="col">Key</th>
                <th scope="col">Title</th>
                <th scope="col">Type</th>
                <th scope="col">Status</th>
                <th scope="col">Epic</th>
                <th scope="col">Assignee</th>
                <th scope="col">Estimate</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket._id} className="backlog-row" onClick={() => navigate(`/tickets/${ticket._id}`)}>
                  <td>{ticket.key}</td>
                  <td>
                    <Link to={`/tickets/${ticket._id}`}>{ticket.title}</Link>
                  </td>
                  <td>{getTypeLabel(ticket.type)}</td>
                  <td>{getStatusLabel(ticket.status)}</td>
                  <td>{getEpicLabel(epics, ticket.epicId)}</td>
                  <td>{getMemberName(members, ticket.assignee)}</td>
                  <td>{ticket.estimate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen ? (
        <TicketModal mode="create" epics={epics} members={members} onClose={() => setIsModalOpen(false)} onSaved={handleTicketSaved} />
      ) : null}
    </div>
  );
}

export default Backlog;
