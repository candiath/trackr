import { describe, expect, it } from 'vitest';
import { nowForInput, resolveInputInstant } from './format';

// Build the reference instant from a tz-naive string so it is the *local* time in
// whatever timezone the tests run; the helpers compensate the offset, so the
// expectations below hold regardless of the runner's TZ.
const LOCAL_NOW = new Date('2026-06-30T15:30:45.123');

describe('nowForInput', () => {
  it('formats an instant as a minute-precision local datetime-local value', () => {
    expect(nowForInput(LOCAL_NOW)).toBe('2026-06-30T15:30');
  });
});

describe('resolveInputInstant', () => {
  it('lands on the real instant when logging the current minute', () => {
    // The input only carries minute precision, but the counter must start at 0,
    // so the current seconds/millis are stamped onto it.
    expect(resolveInputInstant(nowForInput(LOCAL_NOW), LOCAL_NOW)).toBe(
      LOCAL_NOW.toISOString(),
    );
  });

  it('stamps the current seconds onto a past minute, so the elapsed time starts at :00', () => {
    const picked = '2026-06-30T09:15'; // 6h15m before LOCAL_NOW (15:30)
    const elapsedMs =
      LOCAL_NOW.getTime() - new Date(resolveInputInstant(picked, LOCAL_NOW)).getTime();
    expect(elapsedMs).toBe((6 * 60 + 15) * 60_000); // exact minutes, zero seconds
  });
});
