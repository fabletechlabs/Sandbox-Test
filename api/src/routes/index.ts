import { Router } from 'express';
import { ah } from '../util/asyncHandler';
import * as epics from '../controllers/epicController';
import * as tickets from '../controllers/ticketController';
import * as docs from '../controllers/docController';
import * as users from '../controllers/userController';
import * as webhooks from '../controllers/webhookController';
import * as board from '../controllers/boardController';
import * as meta from '../controllers/metaController';

const router = Router();

// Health & meta
router.get('/health', meta.getHealth);
router.get('/meta', ah(meta.getMeta));
router.get('/members', ah(meta.listMembers));

// Board
router.get('/board', ah(board.getBoard));

// Epics
router.get('/epics', ah(epics.listEpics));
router.post('/epics', ah(epics.postEpic));
router.get('/epics/:id', ah(epics.getEpic));
router.patch('/epics/:id', ah(epics.patchEpic));

// Tickets
router.get('/tickets', ah(tickets.listTickets));
router.post('/tickets', ah(tickets.postTicket));
router.post('/tickets/reorder', ah(tickets.reorderTickets));
router.get('/tickets/:id', ah(tickets.getTicket));
router.patch('/tickets/:id', ah(tickets.patchTicket));
router.delete('/tickets/:id', ah(tickets.deleteTicket));
router.post('/tickets/:id/comments', ah(tickets.postComment));

// Docs
router.get('/docs', ah(docs.listDocs));
router.post('/docs', ah(docs.postDoc));
router.get('/docs/:slug', ah(docs.getDoc));
router.patch('/docs/:id', ah(docs.patchDoc));
router.delete('/docs/:id', ah(docs.deleteDoc));

// Users, outbox, and the inbound webhook (the end-to-end flow to trace)
router.get('/users', ah(users.listUsers));
router.get('/outbox', ah(users.listOutbox));
router.post('/webhooks/user-provisioned', ah(webhooks.handleUserProvisioned));

export default router;
