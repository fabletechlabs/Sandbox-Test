import axios from 'axios';

import type {
  BoardResponse,
  Comment,
  Doc,
  Epic,
  EpicDetailResponse,
  Member,
  Ticket,
  TicketDetailResponse,
} from '../types';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({ baseURL });

export interface HealthResponse {
  status: string;
}

export interface CreateEpicInput {
  title: string;
  description?: string;
  color?: string;
}

export type UpdateEpicInput = Partial<
  CreateEpicInput & {
    status: Epic['status'];
  }
>;

export interface CreateTicketInput {
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  type?: Ticket['type'];
  status?: string;
  estimate?: number;
  epicId?: string | null;
  assignee?: string;
}

export type UpdateTicketInput = Partial<CreateTicketInput>;

export interface ReorderItem {
  id: string;
  order: number;
  status: string;
}

export interface CreateCommentInput {
  author: string;
  body: string;
}

export interface GetTicketsParams {
  status?: string;
  epicId?: string;
}

export interface DocResponse {
  doc: Doc;
}

export interface CreateDocInput {
  title: string;
  body?: string;
}

export type UpdateDocInput = Partial<CreateDocInput>;

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/health');
  return data;
}

export async function getMembers(): Promise<Member[]> {
  const { data } = await apiClient.get<Member[]>('/members');
  return data;
}

export async function getEpics(): Promise<Epic[]> {
  const { data } = await apiClient.get<Epic[]>('/epics');
  return data;
}

export async function getEpic(id: string): Promise<EpicDetailResponse> {
  const { data } = await apiClient.get<EpicDetailResponse>(`/epics/${id}`);
  return data;
}

export async function createEpic(input: CreateEpicInput): Promise<Epic> {
  const { data } = await apiClient.post<Epic>('/epics', input);
  return data;
}

export async function updateEpic(id: string, input: UpdateEpicInput): Promise<Epic> {
  const { data } = await apiClient.patch<Epic>(`/epics/${id}`, input);
  return data;
}

export async function getTickets(params: GetTicketsParams = {}): Promise<Ticket[]> {
  const { data } = await apiClient.get<Ticket[]>('/tickets', { params });
  return data;
}

export async function getTicket(id: string): Promise<TicketDetailResponse> {
  const { data } = await apiClient.get<TicketDetailResponse>(`/tickets/${id}`);
  return data;
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const { data } = await apiClient.post<Ticket>('/tickets', input);
  return data;
}

export async function updateTicket(id: string, input: UpdateTicketInput): Promise<Ticket> {
  const { data } = await apiClient.patch<Ticket>(`/tickets/${id}`, input);
  return data;
}

export async function deleteTicket(id: string): Promise<{ ok: true }> {
  const { data } = await apiClient.delete<{ ok: true }>(`/tickets/${id}`);
  return data;
}

export async function reorderTickets(items: ReorderItem[]): Promise<{ ok: true }> {
  const { data } = await apiClient.post<{ ok: true }>('/tickets/reorder', { items });
  return data;
}

export async function addComment(ticketId: string, input: CreateCommentInput): Promise<Comment> {
  const { data } = await apiClient.post<Comment>(`/tickets/${ticketId}/comments`, input);
  return data;
}

export async function getBoard(): Promise<BoardResponse> {
  const { data } = await apiClient.get<BoardResponse>('/board');
  return data;
}

export async function listDocs(): Promise<Doc[]> {
  const { data } = await apiClient.get<Doc[]>('/docs');
  return data;
}

export async function getDoc(slug: string): Promise<DocResponse> {
  const { data } = await apiClient.get<DocResponse>(`/docs/${slug}`);
  return data;
}

export async function createDoc(input: CreateDocInput): Promise<Doc> {
  const { data } = await apiClient.post<Doc>('/docs', input);
  return data;
}

export async function updateDoc(id: string, input: UpdateDocInput): Promise<Doc> {
  const { data } = await apiClient.patch<Doc>(`/docs/${id}`, input);
  return data;
}

export async function deleteDoc(id: string): Promise<{ ok: true }> {
  const { data } = await apiClient.delete<{ ok: true }>(`/docs/${id}`);
  return data;
}
