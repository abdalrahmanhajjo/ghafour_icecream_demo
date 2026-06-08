// Fail fast on missing/weak configuration instead of starting an insecure server.
const isProd = process.env.NODE_ENV === 'production';

export function validateEnv() {
  const errors = [];
  const warn = [];

  if (!process.env.MONGO_URI) errors.push('MONGO_URI is required');

  const secret = process.env.JWT_SECRET || '';
  if (!secret) errors.push('JWT_SECRET is required');
  else if (secret.length < 24) {
    const msg = 'JWT_SECRET should be at least 24 chars';
    isProd ? errors.push(msg) : warn.push(msg);
  }
  if (/change-?me|change-this|secret|password/i.test(secret)) {
    const msg = 'JWT_SECRET looks like a placeholder — set a real random value';
    isProd ? errors.push(msg) : warn.push(msg);
  }

  if (isProd && (!process.env.CLIENT_ORIGIN || process.env.CLIENT_ORIGIN === '*')) {
    errors.push('CLIENT_ORIGIN must be set to your domain in production (no "*")');
  }

  warn.forEach((w) => console.warn('[env] WARN:', w));
  if (errors.length) {
    console.error('[env] Invalid configuration:\n - ' + errors.join('\n - '));
    process.exit(1);
  }
}
