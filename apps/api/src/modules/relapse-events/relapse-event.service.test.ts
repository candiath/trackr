import { beforeEach, describe, expect, it, vi } from 'vitest';

// Isolate the service from the DB and its sibling modules so we test only its own
// logic: id/kind handling and the upsert-vs-create branch.
vi.mock('../relapses/relapse.service', () => ({
  relapseService: { getById: vi.fn() },
}));
vi.mock('../relapses/relapse.repository', () => ({
  relapseRepository: { touch: vi.fn() },
}));
vi.mock('../triggers/trigger.service', () => ({
  triggerService: { resolveId: vi.fn() },
}));
vi.mock('./relapse-event.repository', () => ({
  relapseEventRepository: { create: vi.fn(), upsert: vi.fn() },
}));
vi.mock('./relapse-event.mapper', () => ({
  toRelapseEventDTO: (row: unknown) => row,
}));

import { triggerService } from '../triggers/trigger.service';
import { relapseEventRepository } from './relapse-event.repository';
import { relapseEventService } from './relapse-event.service';

const repo = vi.mocked(relapseEventRepository);
const triggers = vi.mocked(triggerService);

const baseInput = { date: '2026-02-01T00:00:00.000Z' };

describe('relapseEventService.create', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    triggers.resolveId.mockResolvedValue(null);
    repo.create.mockImplementation((data) => ({ id: 'server-cuid', ...data }) as never);
    repo.upsert.mockImplementation((id, data) => ({ id, ...data }) as never);
  });

  it('defaults kind to RELAPSE when none is sent', async () => {
    await relapseEventService.create('b1', baseInput);
    const [data] = repo.create.mock.calls[0];
    expect(data.kind).toBe('RELAPSE');
  });

  it('keeps the URGE kind when sent (a resisted temptation)', async () => {
    await relapseEventService.create('b1', { ...baseInput, kind: 'URGE' });
    const [data] = repo.create.mock.calls[0];
    expect(data.kind).toBe('URGE');
  });

  it('upserts by the client-supplied id (idempotent on retry)', async () => {
    await relapseEventService.create('b1', { ...baseInput, id: 'evt-uuid' });
    expect(repo.upsert).toHaveBeenCalledWith('evt-uuid', expect.objectContaining({ kind: 'RELAPSE' }));
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('creates with a server id when none is provided', async () => {
    await relapseEventService.create('b1', baseInput);
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.upsert).not.toHaveBeenCalled();
  });
});
