import { beforeEach, describe, expect, it, vi } from 'vitest';

// Isolate the service from the DB and the factor module: test only its own logic
// (id handling, the upsert-vs-create branch, and factor connection).
vi.mock('../factors/factor.service', () => ({
  factorService: { resolveIds: vi.fn() },
}));
vi.mock('./mood.repository', () => ({
  moodRepository: { create: vi.fn(), upsert: vi.fn() },
}));
vi.mock('./mood.mapper', () => ({
  toMoodEntryDTO: (row: unknown) => row,
}));

import { factorService } from '../factors/factor.service';
import { moodRepository } from './mood.repository';
import { moodService } from './mood.service';

const repo = vi.mocked(moodRepository);
const factors = vi.mocked(factorService);

const input = { date: '2026-02-01T00:00:00.000Z', level: 'GOOD' as const, factors: [] as string[] };

describe('moodService.create', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    factors.resolveIds.mockResolvedValue([]);
    repo.create.mockImplementation((data) => ({ id: 'server-cuid', ...data }) as never);
    repo.upsert.mockImplementation((id, data) => ({ id, ...data }) as never);
  });

  it('upserts by the client-supplied id (idempotent on retry)', async () => {
    await moodService.create({ ...input, id: 'mood-uuid' });
    expect(repo.upsert).toHaveBeenCalledWith('mood-uuid', expect.objectContaining({ level: 'GOOD' }));
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('creates with a server id when none is provided', async () => {
    await moodService.create(input);
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('connects the resolved factor ids (catalog + custom)', async () => {
    factors.resolveIds.mockResolvedValue(['f1', 'f2']);
    await moodService.create({ ...input, id: 'mood-uuid', customFactors: ['Sleep'] });
    const [, data] = repo.upsert.mock.calls[0];
    expect(data.factors).toEqual({ connect: [{ id: 'f1' }, { id: 'f2' }] });
  });
});
