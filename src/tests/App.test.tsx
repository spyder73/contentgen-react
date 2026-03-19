import { normalizeClipStyleList } from '../api/clipstyleSchema';

test('normalizes string-only style list payload', () => {
  const result = normalizeClipStyleList(['standard', 'medieval']);

  expect(result).toEqual([
    { id: 'standard', name: 'Standard', description: '' },
    { id: 'medieval', name: 'Medieval', description: '' },
  ]);
});
