import mongoose from 'mongoose';
import { connectDB } from './db';
import { config } from './config';
import { Epic } from './models/Epic';
import { Ticket } from './models/Ticket';
import { Comment } from './models/Comment';
import { Member } from './models/Member';
import { Doc } from './models/Doc';
import { User } from './models/User';
import { Email } from './models/Email';

const members = [
  { name: 'Ada Lovelace', role: 'Engineer' },
  { name: 'Grace Hopper', role: 'Engineer' },
  { name: 'Linus Torvalds', role: 'Engineer' },
  { name: 'Margaret Hamilton', role: 'Lead' },
];

const epics = [
  {
    key: 'EPIC-1',
    title: 'Onboarding revamp',
    description: 'Make the first five minutes of a new account feel effortless.',
    color: '#3b82f6',
    status: 'open',
    // Note: these cached numbers were written by the app over time.
    stats: { total: 5, done: 3 },
  },
  {
    key: 'EPIC-2',
    title: 'Billing v2',
    description: 'Move billing onto the new subscription engine.',
    color: '#10b981',
    status: 'open',
    stats: { total: 4, done: 0 },
  },
  {
    key: 'EPIC-3',
    title: 'Mobile polish',
    description: 'Small fixes to make the mobile app feel native.',
    color: '#8b5cf6',
    status: 'done',
    stats: { total: 3, done: 3 },
  },
];

// epicKey lets us wire tickets to epics without hardcoding ObjectIds.
const tickets = [
  // EPIC-1
  { key: 'CARD-1', title: 'Design welcome screen', type: 'story', status: 'done', estimate: 3, assignee: 'Ada Lovelace', epicKey: 'EPIC-1', order: 0, description: 'A friendly first screen that greets the user by name.', acceptanceCriteria: 'Given a new user, when they finish signup, then they see a welcome screen showing their first name and a Get Started button.' },
  { key: 'CARD-2', title: 'Implement email verification', type: 'story', status: 'done', estimate: 5, assignee: 'Grace Hopper', epicKey: 'EPIC-1', order: 1, description: 'Send a verification email and confirm the address before activation.' },
  { key: 'CARD-3', title: 'Add progress checklist to onboarding', type: 'task', status: 'in_progress', estimate: 3, assignee: 'Ada Lovelace', epicKey: 'EPIC-1', order: 0, description: 'A checklist that tracks the three setup steps.' },
  { key: 'CARD-4', title: 'Skip button crashes on step 2', type: 'bug', status: 'todo', estimate: 2, assignee: 'Linus Torvalds', epicKey: 'EPIC-1', order: 0, description: 'Reproduces when the user has not uploaded a profile photo.' },

  // EPIC-2
  { key: 'CARD-5', title: 'Stripe subscription integration', type: 'story', status: 'in_progress', estimate: 8, assignee: 'Grace Hopper', epicKey: 'EPIC-2', order: 1, description: 'Create and manage subscriptions through Stripe.' },
  { key: 'CARD-6', title: 'Invoice PDF export', type: 'story', status: 'backlog', estimate: 5, assignee: '', epicKey: 'EPIC-2', order: 0, description: 'Let customers download a PDF invoice for any billing period.' },
  { key: 'CARD-7', title: 'Proration on plan change', type: 'task', status: 'backlog', estimate: 5, assignee: '', epicKey: 'EPIC-2', order: 1, description: 'When a customer changes plans mid-cycle, charge or credit the difference.' },
  { key: 'CARD-8', title: 'Tax rounding off by a cent on annual plans', type: 'bug', status: 'in_review', estimate: 2, assignee: 'Linus Torvalds', epicKey: 'EPIC-2', order: 0, description: 'Annual invoices are occasionally a cent high.', acceptanceCriteria: 'Given an annual plan with tax, when the invoice is generated, then the total matches the sum of line items to the cent.' },

  // EPIC-3
  { key: 'CARD-9', title: 'Fix tab bar on notch devices', type: 'task', status: 'done', estimate: 3, assignee: 'Margaret Hamilton', epicKey: 'EPIC-3', order: 0, description: 'The tab bar overlaps the home indicator on some phones.' },
  { key: 'CARD-10', title: 'Reduce cold start time', type: 'task', status: 'done', estimate: 5, assignee: 'Margaret Hamilton', epicKey: 'EPIC-3', order: 1, description: 'Trim the launch time on first open.' },
  { key: 'CARD-11', title: 'Dark mode', type: 'story', status: 'done', estimate: 8, assignee: 'Ada Lovelace', epicKey: 'EPIC-3', order: 2, description: 'A full dark theme that follows the system setting.' },

  // No epic
  { key: 'CARD-12', title: 'Login rate limiting too aggressive', type: 'bug', status: 'todo', estimate: 2, assignee: 'Grace Hopper', epicKey: null, order: 1, description: 'Legitimate users on shared networks are being throttled.' },
  { key: 'CARD-13', title: 'Upgrade Node runtime to 20', type: 'task', status: 'backlog', estimate: 3, assignee: '', epicKey: null, order: 2, description: 'Move services onto Node 20 LTS.' },
  { key: 'CARD-14', title: 'Add audit log for admin actions', type: 'story', status: 'blocked', estimate: 5, assignee: '', epicKey: null, order: 0, description: 'Record who changed what in the admin panel. Blocked on the security review.' },
];

const comments = [
  { ticketKey: 'CARD-8', author: 'Linus Torvalds', body: "Repro'd on the 2024 annual plan — looks like a floating-point issue in the tax calc." },
  { ticketKey: 'CARD-8', author: 'Margaret Hamilton', body: 'Good find. Let’s move the calculation to integer cents.' },
  { ticketKey: 'CARD-4', author: 'Ada Lovelace', body: 'I think it’s the missing avatar fallback on step 2.' },
];

const docs = [
  {
    slug: 'welcome',
    title: 'Welcome to Docs',
    body: "# Welcome to Docs\n\nDocs is Cardboard's lightweight wiki — a place for the team to capture notes, decisions, and architecture without leaving the tracker. Every doc is written in markdown, and diagrams render right on the page.\n\nHere's a tiny example of a Mermaid diagram:\n\n```mermaid\nflowchart LR\n  A[Idea] --> B[Doc]\n  B --> C[Shared knowledge]\n```\n\nFeel free to create new docs for anything worth writing down — meeting notes, runbooks, or an explanation of how a tricky part of the system works.\n",
  },
  {
    slug: 'architecture',
    title: 'Architecture overview (start here)',
    body: "# Architecture overview\n\nThis page is intentionally mostly empty — it's meant to be filled in with a real description of how Cardboard is put together. If you're picking this up, use it as a chance to document the system for the next person.\n\nCapture at least:\n\n- How the frontend is structured (pages, components, state)\n- How the API is structured (routes, controllers, services)\n- The data model (Epics, Tickets, Comments, Docs, and how they relate)\n- The request flow, from a click in the browser to a database write and back\n\n## Diagram\n\nSketch the request flow (or any other useful diagram) below.\n\n```mermaid\nflowchart TD\n  %% TODO: describe the request flow here\n```\n",
  },
];

const users = [
  { name: 'Grace Hopper', email: 'grace@example.com', status: 'active', source: 'seed' },
];

const emails = [
  {
    to: 'grace@example.com',
    subject: 'Welcome to Cardboard',
    body: 'Hi Grace, your Cardboard account is ready. Log in to get started.',
    provider: 'ses-mock',
  },
];

/**
 * Wipe and re-insert all seed data.
 * @param extraCount - Extra bulk tickets to add (defaults to the SEED_TICKETS
 *   env var). Used to load a large dataset on demand.
 */
export async function seed(extraCount = Number(process.env.SEED_TICKETS) || 0): Promise<void> {
  await Promise.all([
    Epic.deleteMany({}),
    Ticket.deleteMany({}),
    Comment.deleteMany({}),
    Member.deleteMany({}),
    Doc.deleteMany({}),
    User.deleteMany({}),
    Email.deleteMany({}),
  ]);

  await Member.insertMany(members);

  const epicDocs = await Epic.insertMany(epics);
  const epicIdByKey: Record<string, mongoose.Types.ObjectId> = {};
  for (const e of epicDocs) epicIdByKey[e.key as string] = e._id;

  const ticketDocs = await Ticket.insertMany(
    tickets.map(({ epicKey, ...t }) => ({
      ...t,
      epicId: epicKey ? epicIdByKey[epicKey] : null,
    }))
  );
  const ticketIdByKey: Record<string, mongoose.Types.ObjectId> = {};
  for (const t of ticketDocs) ticketIdByKey[t.key as string] = t._id;

  await Comment.insertMany(
    comments.map((c) => ({
      ticketId: ticketIdByKey[c.ticketKey],
      author: c.author,
      body: c.body,
    }))
  );

  await Doc.insertMany(docs);
  await User.insertMany(users);
  await Email.insertMany(emails);

  // Optional bulk tickets for load testing (extraCount, defaulting to the
  // SEED_TICKETS env var). Off by default so the curated board stays clean.
  if (extraCount > 0) {
    const statuses = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];
    const types = ['story', 'bug', 'task'];
    const epicIds = epicDocs.map((e) => e._id);
    const bulk = Array.from({ length: extraCount }, (_, i) => ({
      key: `CARD-${100000 + i}`, // high offset so generated keys never collide
      title: `Backlog item ${i + 1}`,
      type: types[i % types.length],
      status: statuses[i % statuses.length],
      estimate: (i % 8) + 1,
      epicId: i % 4 === 0 ? null : epicIds[i % epicIds.length],
      assignee: '',
      order: i,
    }));
    await Ticket.insertMany(bulk);
  }

  console.log(
    `[seed] inserted ${members.length} members, ${epics.length} epics, ${tickets.length} tickets` +
      `${extraCount ? ` (+${extraCount} bulk)` : ''}, ${comments.length} comments, ${docs.length} docs, ${users.length} users, ${emails.length} emails`
  );
}

/**
 * Seed the database on startup if it is empty, or if SEED=reset is set.
 * Assumes a live Mongoose connection.
 */
export async function seedIfNeeded(): Promise<void> {
  const count = await Ticket.countDocuments();
  if (config.seed === 'reset') {
    console.log('[seed] SEED=reset — reseeding');
    await seed();
  } else if (count === 0) {
    console.log('[seed] empty database — seeding');
    await seed();
  } else {
    console.log(`[seed] database already has ${count} tickets — skipping`);
  }
}

// Allow running as a standalone script: `npm run seed`.
if (require.main === module) {
  (async () => {
    await connectDB();
    await seed();
    await mongoose.disconnect();
    process.exit(0);
  })();
}
