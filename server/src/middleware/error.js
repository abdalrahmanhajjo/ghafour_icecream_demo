export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  // Log full detail server-side; never leak internals to the client on 5xx.
  if (status >= 500) console.error(err);
  const isProd = process.env.NODE_ENV === 'production';
  const message = status >= 500 && isProd ? 'Server error' : err.message || 'Server error';
  res.status(status).json({ error: message });
}
