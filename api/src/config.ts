export const config = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cardboard',
  port: Number(process.env.PORT) || 4000,
  seed: process.env.SEED || '',
  webhookSecret: process.env.WEBHOOK_SECRET || 'dev-secret',
};
