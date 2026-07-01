import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the repository so the service's update/merge logic is tested without a DB.
vi.mock('./relapse.repository', () => ({
  relapseRepository: {
    findById: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
  },
}));

// The mapper just shapes a Prisma row into a DTO; passing the row through keeps
// the test focused on the service and avoids asserting on mapper internals.
vi.mock('./relapse.mapper', () => ({
  toRelapseDTO: (row: unknown) => row,
}));

import { relapseRepository } from './relapse.repository';
import { relapseService } from './relapse.service';

const repo = vi.mocked(relapseRepository);

const existing = {
  id: 'b1',
  name: 'Alcohol',
  description: 'keep me',
  color: '#aaa',
  icon: 'wine',
  startDate: new Date('2026-01-01T00:00:00.000Z'),
};

describe('relapseService.update (partial)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    repo.findById.mockResolvedValue(existing as never);
    repo.update.mockImplementation((_id, data) => ({ ...existing, ...data }) as never);
  });

  it('throws 404 when the behavior does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(relapseService.update('missing', { name: 'X' })).rejects.toThrow(
      'Behavior not found',
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('only sends the fields present in the request', async () => {
    await relapseService.update('b1', { name: 'New name' });
    expect(repo.update).toHaveBeenCalledWith('b1', { name: 'New name' });
  });

  it('does NOT wipe description when the field is omitted', async () => {
    await relapseService.update('b1', { color: '#bbb' });
    const [, data] = repo.update.mock.calls[0];
    expect(data).not.toHaveProperty('description');
    expect(data).toEqual({ color: '#bbb' });
  });

  it('clears description when null is sent explicitly', async () => {
    await relapseService.update('b1', { description: null } as never);
    const [, data] = repo.update.mock.calls[0];
    expect(data).toHaveProperty('description', null);
  });

  it('parses startDate into a Date only when present', async () => {
    await relapseService.update('b1', { startDate: '2026-02-15T00:00:00.000Z' });
    const [, data] = repo.update.mock.calls[0];
    expect(data.startDate).toBeInstanceOf(Date);
    expect((data.startDate as Date).toISOString()).toBe('2026-02-15T00:00:00.000Z');
  });

  it('an empty body is a no-op update (no fields set)', async () => {
    await relapseService.update('b1', {});
    expect(repo.update).toHaveBeenCalledWith('b1', {});
  });
});

describe('relapseService.create (client id → upsert)', () => {
  const form = {
    name: 'Alcohol',
    color: '#aaa',
    icon: 'wine',
    startDate: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.resetAllMocks();
    repo.create.mockImplementation((data) => ({ id: 'server-cuid', ...data }) as never);
    repo.upsert.mockImplementation((id, data) => ({ id, ...data }) as never);
  });

  it('upserts by the client-supplied id (idempotent create)', async () => {
    await relapseService.create({ ...form, id: 'client-uuid' });
    expect(repo.upsert).toHaveBeenCalledWith('client-uuid', expect.objectContaining({ name: 'Alcohol' }));
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('falls back to a server-minted id when none is provided', async () => {
    await relapseService.create(form);
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('parses startDate into a Date', async () => {
    await relapseService.create({ ...form, id: 'client-uuid' });
    const [, data] = repo.upsert.mock.calls[0];
    expect(data.startDate).toBeInstanceOf(Date);
  });
});
