export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const readString = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
};

export const readFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

export const getClipPromptTitle = (parsedPrompt: Record<string, unknown>, index: number): string => {
  const explicitName = readString(parsedPrompt.name ?? parsedPrompt.title);
  if (explicitName) return explicitName;
  return `Clip Prompt ${index + 1}`;
};
