import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

await connectDb();
createApp().listen(env.port, () => {
  console.log(`Hotel API listening on port ${env.port}`);
});

