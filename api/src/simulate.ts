// A tiny traffic generator. It fires the inbound "user provisioned" webhook on
// an interval so the app always has a live flow to watch and trace, without
// anyone running curl by hand. Runs as its own container in docker-compose.

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:4000/api/webhooks/user-provisioned';
const SECRET = process.env.WEBHOOK_SECRET || 'dev-secret';
const INTERVAL = Number(process.env.SIMULATE_INTERVAL) || 10000;
const BAD_SECRET_RATE = Number(process.env.SIMULATE_BAD_SECRET_RATE) || 0;

const firstNames = ['Ada', 'Alan', 'Grace', 'Katherine', 'Linus', 'Margaret', 'Dennis', 'Barbara', 'Guido', 'Radia'];
const lastNames = ['Lovelace', 'Turing', 'Hopper', 'Johnson', 'Torvalds', 'Hamilton', 'Ritchie', 'Liskov', 'Rossum', 'Perlman'];
const sources = ['hr-system', 'sso-provider', 'signup-form', 'admin-invite'];

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fireOnce(n: number): Promise<void> {
  const first = pick(firstNames);
  const last = pick(lastNames);
  const name = `${first} ${last}`;
  const email = `${first}.${last}.${n}@example.com`.toLowerCase();
  const source = pick(sources);
  // Optionally send a wrong secret some of the time so rejections show up too.
  const useBadSecret = BAD_SECRET_RATE > 0 && Math.random() < BAD_SECRET_RATE;

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-webhook-secret': useBadSecret ? 'wrong-secret' : SECRET,
      },
      body: JSON.stringify({ email, name, source }),
    });
    console.log(`[simulator] provision ${email} from ${source} -> ${res.status}`);
  } catch (err) {
    console.log(`[simulator] could not reach ${WEBHOOK_URL}: ${(err as Error).message}`);
  }
}

async function main(): Promise<void> {
  console.log(`[simulator] firing ${WEBHOOK_URL} every ${INTERVAL}ms (bad-secret rate ${BAD_SECRET_RATE})`);
  await sleep(3000); // give the API a moment to come up first
  let n = 1;
  for (;;) {
    await fireOnce(n);
    n += 1;
    await sleep(INTERVAL);
  }
}

main();
