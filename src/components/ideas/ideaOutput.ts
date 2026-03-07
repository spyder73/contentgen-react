const toJsonString = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  return JSON.stringify(value);
};

const normalizePromptList = (values: unknown[]): string[] => {
  return values
    .map((item) => toJsonString(item))
    .map((item) => item.trim())
    .filter(Boolean);
};

export const extractClipPromptJsonList = (rawOutput: string): string[] => {
  const output = rawOutput.trim();
  if (!output) return [];

  try {
    const parsed = JSON.parse(output) as unknown;

    if (Array.isArray(parsed)) {
      return normalizePromptList(parsed);
    }

    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;
      const directList = record.clip_prompt_list;
      if (Array.isArray(directList)) {
        return normalizePromptList(directList);
      }

      const outputs = record.outputs;
      if (Array.isArray(outputs)) {
        return normalizePromptList(outputs);
      }

      return [JSON.stringify(record)];
    }

    return [String(parsed)];
  } catch {
    return [output];
  }
};
