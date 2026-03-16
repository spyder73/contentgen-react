import { toActionableErrorMessage } from './helpers';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readMissingReferenceRows = (value: unknown): unknown[] => {
  if (!isRecord(value)) return [];
  const candidate =
    value.missing_required_references ??
    value.missing_required_scene_references ??
    value.missing_references ??
    value.unresolved_scenes;
  return Array.isArray(candidate) ? candidate : [];
};

export const extractRequiredReferenceMessage = (error: unknown): string => {
  const payload = (error as { response?: { data?: unknown } })?.response?.data;
  const directRows = readMissingReferenceRows(payload);
  const nestedRows = isRecord(payload) ? readMissingReferenceRows(payload.details) : [];
  const firstRow = [...directRows, ...nestedRows].find((item) => isRecord(item));
  if (firstRow && isRecord(firstRow)) {
    const rowMessage = String(firstRow.error ?? firstRow.message ?? firstRow.reason ?? '').trim();
    if (rowMessage) return rowMessage;
  }

  const payloadMessage = isRecord(payload)
    ? String(payload.message ?? payload.error ?? '').trim()
    : '';
  if (payloadMessage) return payloadMessage;

  return 'Attach the required reference asset before continuing.';
};

export const isRequiredReferenceBlockError = (error: unknown): boolean => {
  const payload = (error as { response?: { data?: unknown } })?.response?.data;
  const rows = [
    ...readMissingReferenceRows(payload),
    ...(isRecord(payload) ? readMissingReferenceRows(payload.details) : []),
  ];
  if (rows.length > 0) return true;

  const text = toActionableErrorMessage(error, '').toLowerCase();
  return (
    text.includes('required reference') ||
    text.includes('missing reference') ||
    text.includes('reference required')
  );
};
