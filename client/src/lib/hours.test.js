import { describe, expect, it } from 'vitest';
import { beirutMinutes, isOpen } from './hours.js';

// Beirut is UTC+2 in winter (EET); these instants are in November.
const at = (utc) => new Date(`2026-11-21T${utc}:00Z`);

describe('shop hours (Beirut time)', () => {
  it('reads the time in Beirut, not the visitor’s time zone', () => {
    expect(beirutMinutes(at('08:30'))).toBe(10 * 60 + 30);
  });

  it('is open from 10:30 until 00:30 the next day', () => {
    expect(isOpen(at('08:29'))).toBe(false); // 10:29
    expect(isOpen(at('08:30'))).toBe(true); // 10:30
    expect(isOpen(at('20:00'))).toBe(true); // 22:00
    expect(isOpen(at('22:29'))).toBe(true); // 00:29
    expect(isOpen(at('22:30'))).toBe(false); // 00:30
    expect(isOpen(at('01:00'))).toBe(false); // 03:00
  });
});
