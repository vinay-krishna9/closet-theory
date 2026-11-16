import { describe, expect, it, vi, afterEach } from 'vitest';
import { defaultGarment } from './model';
import {
  decodeWardrobe,
  encodeWardrobe,
  readWardrobe,
  writeWardrobe,
  removeWardrobe,
} from './visitor-storage';
const item = { ...defaultGarment('tshirt'), id: 'stable-1' };
afterEach(() => vi.restoreAllMocks());
describe('visitor storage schema boundary', () => {
  it('round trips customized items and intentional duplicates with stable IDs and order', () => {
    const items = [
      { ...item, name: 'My tee', seasons: ['Summer'] as const },
      { ...item, id: 'stable-2' },
    ];
    expect(
      decodeWardrobe(
        encodeWardrobe(items.map((i) => ({ ...i, seasons: [...i.seasons] }))),
      ),
    ).toEqual(items);
    expect(decodeWardrobe(null)).toEqual([]);
  });
  it('serializes only allowed fields, deriving imagery from catalog references', () => {
    const raw = encodeWardrobe([
      { ...item, photo: 'private', token: 'secret' } as typeof item,
    ]);
    expect(raw).not.toMatch(/private|secret|photo|token/);
    expect(decodeWardrobe(raw)[0].id).toBe(item.id);
  });
  it.each([
    '{',
    'null',
    '[]',
    '{}',
    '{"version":0,"items":[]}',
    '{"version":2,"items":[]}',
    '{"version":1,"items":null}',
  ])('rejects malformed or unsupported data %s', (raw) => {
    expect(() => decodeWardrobe(raw)).toThrow();
  });
  it.each([
    { typeId: 'unknown' },
    { color: 'unknown' },
    { name: '' },
    { name: 4 },
    { seasons: null },
    { seasons: ['Summer', 'Summer'] },
    { formality: 'unknown' },
    { neckline: {} },
    { sleeves: 'bad' },
    { id: ' ' },
    { pattern: 'bad' },
  ])('rejects invalid fields without trusting JSON %j', (invalid) => {
    expect(() =>
      decodeWardrobe(
        JSON.stringify({ version: 1, items: [{ ...item, ...invalid }] }),
      ),
    ).toThrow();
  });
  it('rejects duplicate identity and irrelevant details', () => {
    expect(() =>
      decodeWardrobe(JSON.stringify({ version: 1, items: [item, item] })),
    ).toThrow();
    expect(() =>
      encodeWardrobe([
        { ...defaultGarment('jeans'), id: 'j', neckline: 'Crew neck' },
      ]),
    ).toThrow();
  });
  it('surfaces storage access, quota and deletion failures', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    expect(readWardrobe).toThrow();
    expect(() => writeWardrobe([item])).toThrow();
    expect(removeWardrobe).toThrow();
  });
});
