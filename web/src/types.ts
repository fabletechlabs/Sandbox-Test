export interface Member {
  _id: string;
  name: string;
  role: string;
}

export interface EpicStats {
  total: number;
  done: number;
}

export type EpicStatus = 'open' | 'done';

export interface Epic {
  _id: string;
  key: string;
  title: string;
  description: string;
  color: string;
  status: EpicStatus;
  stats: EpicStats;
  /** 0-100. Deliberately may not agree with `stats` — see constants.ts note. */
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface EpicDetailResponse {
  epic: Epic;
  tickets: Ticket[];
}

export type TicketType = 'story' | 'bug' | 'task';

export interface Ticket {
  _id: string;
  key: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  type: TicketType;
  /** One of STATUSES in most cases, but seed data may contain other values (e.g. 'blocked'). */
  status: string;
  estimate: number;
  epicId: string | null;
  assignee: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Doc {
  _id: string;
  slug: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface TicketDetailResponse {
  ticket: Ticket;
  epic: Epic | null;
  comments: Comment[];
}

/** The epic reference embedded in a board ticket — a subset of Epic's fields. */
export interface BoardEpicRef {
  _id: string;
  key: string;
  title: string;
  color: string;
}

export interface BoardTicket extends Ticket {
  epic: BoardEpicRef | null;
}

export interface BoardColumn {
  status: string;
  tickets: BoardTicket[];
}

export interface BoardResponse {
  columns: BoardColumn[];
}
