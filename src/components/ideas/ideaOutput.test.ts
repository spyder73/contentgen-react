import { extractClipPromptJsonList } from './ideaOutput';

describe('extractClipPromptJsonList', () => {
  it('returns a single JSON string when output is one object', () => {
    const list = extractClipPromptJsonList('{"name":"one"}');
    expect(list).toEqual(['{"name":"one"}']);
  });

  it('returns multiple JSON strings when output is a JSON array', () => {
    const list = extractClipPromptJsonList('[{"name":"one"},{"name":"two"}]');
    expect(list).toEqual(['{"name":"one"}', '{"name":"two"}']);
  });

  it('supports wrapped outputs arrays from distributor payloads', () => {
    const list = extractClipPromptJsonList('{"outputs":[{"id":1},{"id":2}]}');
    expect(list).toEqual(['{"id":1}', '{"id":2}']);
  });

  it('falls back to plain text output if not valid JSON', () => {
    const list = extractClipPromptJsonList('plain output');
    expect(list).toEqual(['plain output']);
  });
});
