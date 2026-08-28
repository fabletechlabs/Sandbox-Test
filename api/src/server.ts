import { createApp } from './app';
import { connectDB } from './db';
import { config } from './config';
import { seedIfNeeded } from './seed';

async function start() {
  await connectDB();
  await seedIfNeeded();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[api] Cardboard API listening on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('[api] failed to start', err);
  process.exit(1);
});
