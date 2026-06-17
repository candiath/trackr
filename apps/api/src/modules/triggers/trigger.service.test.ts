import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the repository so the service's branching logic is tested in isolation,
// with no database. The factory returns vi.fn()s we reconfigure per test.
vi.mock('./trigger.repository', () => ({
  triggerRepository: {
    findByName: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  },
}));

import { triggerRepository } from './trigger.repository';
import { triggerService } from './trigger.service';

const repo = vi.mocked(triggerRepository);

describe('triggerService.resolveId', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns null when neither a custom name nor an id is given', async () => {
    expect(await triggerService.resolveId({})).toBeNull();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('reuses an existing trigger when the custom name already exists (case-insensitive lookup)', async () => {
    repo.findByName.mockResolvedValue({ id: 't1' } as never);

    const id = await triggerService.resolveId({ triggerCustom: 'Stress' });

    expect(id).toBe('t1');
    expect(repo.findByName).toHaveBeenCalledWith('Stress');
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('creates a new trigger when the custom name is unknown', async () => {
    repo.findByName.mockResolvedValue(null);
    repo.create.mockResolvedValue({ id: 'new' } as never);

    const id = await triggerService.resolveId({ triggerCustom: 'Boredom' });

    expect(id).toBe('new');
    expect(repo.create).toHaveBeenCalledWith('Boredom', false);
  });

  it('trims the custom name before looking it up / creating', async () => {
    repo.findByName.mockResolvedValue(null);
    repo.create.mockResolvedValue({ id: 'x' } as never);

    await triggerService.resolveId({ triggerCustom: '  Anxiety  ' });

    expect(repo.findByName).toHaveBeenCalledWith('Anxiety');
    expect(repo.create).toHaveBeenCalledWith('Anxiety', false);
  });

  it('free text wins over a provided triggerId', async () => {
    repo.findByName.mockResolvedValue({ id: 'custom' } as never);

    const id = await triggerService.resolveId({
      triggerId: 'catalog-id',
      triggerCustom: 'Loneliness',
    });

    expect(id).toBe('custom');
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('uses triggerId when it resolves to an existing trigger', async () => {
    repo.findById.mockResolvedValue({ id: 'catalog-id' } as never);

    const id = await triggerService.resolveId({ triggerId: 'catalog-id' });

    expect(id).toBe('catalog-id');
  });

  it('returns null when the given triggerId does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const id = await triggerService.resolveId({ triggerId: 'missing' });

    expect(id).toBeNull();
  });

  it('ignores a blank custom name and falls through to triggerId', async () => {
    repo.findById.mockResolvedValue({ id: 'catalog-id' } as never);

    const id = await triggerService.resolveId({
      triggerId: 'catalog-id',
      triggerCustom: '   ',
    });

    expect(id).toBe('catalog-id');
    expect(repo.create).not.toHaveBeenCalled();
  });
});
