import { createLocalServer } from './app.js';

const local = await createLocalServer();
const address = await local.listen();
console.info(`LifeCity LOCAL DEVELOPMENT REFERENCE API: ${address}`);
console.info('Local disk accounts only. No email delivery, hosted cloud save, or production auth claim.');
let closing = false;
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    if (closing) return;
    closing = true;
    void local.close().then(() => process.exit(0), (error: unknown) => { console.error(error); process.exit(1); });
  });
}
