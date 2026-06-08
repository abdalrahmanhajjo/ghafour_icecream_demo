import { validationResult } from 'express-validator';

// Runs after a chain of express-validator checks; returns 400 with the first error.
export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  res.status(400).json({ error: result.array()[0].msg, fields: result.array() });
}
