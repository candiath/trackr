import { describe, expect, it } from 'vitest';
import { relapseEventCreateSchema } from '@track/shared';

// The schema is shared with the API; `web` is where vitest lives, so the
// future-date guard (issue #3) is exercised here.
describe('relapseEventCreateSchema · date can not be in the future', () => {
  it('accepts an event logged now', () => {
    const res = relapseEventCreateSchema.safeParse({ date: new Date().toISOString() });
    expect(res.success).toBe(true);
  });

  it('accepts a past date', () => {
    const res = relapseEventCreateSchema.safeParse({ date: '2000-01-01T00:00:00.000Z' });
    expect(res.success).toBe(true);
  });

  it('rejects a clearly future date', () => {
    const res = relapseEventCreateSchema.safeParse({ date: '2999-01-01T00:00:00.000Z' });
    expect(res.success).toBe(false);
  });
});
