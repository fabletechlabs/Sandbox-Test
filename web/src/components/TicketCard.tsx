import { Link } from 'react-router-dom';

import { getTypeLabel } from '../constants';
import type { Member, Ticket } from '../types';
import { getMemberName } from '../utils';
import EpicBadge from './EpicBadge';
import StatusSelect from './StatusSelect';

interface TicketCardEpic {
  _id: string;
  key: string;
  title: string;
  color: string;
}

interface TicketCardProps {
  ticket: Ticket;
  epic: TicketCardEpic | null;
  members: Member[];
  /** Omit to render the card without a status control (read-only context). */
  onStatusChange?: (ticketId: string, status: string) => void;
}

function TicketCard({ ticket, epic, members, onStatusChange }: TicketCardProps) {
  const assigneeName = getMemberName(members, ticket.assignee);

  return (
    <li className="ticket-card">
      <div className="ticket-card-top">
        <span className="ticket-key">{ticket.key}</span>
        <span className={`type-badge type-badge-${ticket.type}`}>{getTypeLabel(ticket.type)}</span>
      </div>
      <Link to={`/tickets/${ticket._id}`} className="ticket-card-title">
        {ticket.title}
      </Link>
      <div className="ticket-card-meta">
        <EpicBadge epic={epic} />
        <span className="ticket-estimate">Est: {ticket.estimate ?? 0}</span>
        <span className="ticket-assignee">{assigneeName}</span>
      </div>
      {onStatusChange ? (
        <StatusSelect
          id={`status-${ticket._id}`}
          label="Status"
          value={ticket.status}
          onChange={(status) => onStatusChange(ticket._id, status)}
        />
      ) : null}
    </li>
  );
}

export default TicketCard;
