import axios from 'axios';
import { Account, ScheduleResponse, User, UsersResponse } from './structs/user';
import { isRecord, toNumberValue, toStringValue } from './typeHelpers';

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toStringValue(item))
    .filter((item) => item.length > 0);
};

const toNumberRecord = (value: unknown): Record<string, number> | undefined => {
  if (!isRecord(value)) return undefined;

  const entries = Object.entries(value).reduce<Record<string, number>>((result, [key, rawValue]) => {
    const numberValue = toNumberValue(rawValue);
    if (numberValue !== undefined) {
      result[key] = numberValue;
    }
    return result;
  }, {});

  return Object.keys(entries).length > 0 ? entries : undefined;
};

export const unwrapPayload = (raw: unknown): Record<string, unknown> => {
  if (!isRecord(raw)) return {};
  if (isRecord(raw.data)) return raw.data;
  return raw;
};

const extractMessageFromPayload = (payload: Record<string, unknown>): string =>
  toStringValue(payload.error) ||
  toStringValue(payload.message) ||
  toStringValue(payload.detail) ||
  toStringValue(payload.reason) ||
  toStringValue(payload.code);

const getErrorStatus = (error: unknown): number | null => {
  if (axios.isAxiosError(error) && typeof error.response?.status === 'number') {
    return error.response.status;
  }
  if (isRecord(error) && isRecord(error.response) && typeof error.response.status === 'number') {
    return error.response.status;
  }
  return null;
};

export const isRouteFallbackError = (error: unknown): boolean => {
  const status = getErrorStatus(error);
  return status === 404 || status === 405;
};

const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const payload = unwrapPayload(error.response?.data ?? {});
    const extracted = extractMessageFromPayload(payload);
    if (extracted) return extracted;
  }

  if (isRecord(error) && isRecord(error.response)) {
    const payload = unwrapPayload(error.response.data);
    const extracted = extractMessageFromPayload(payload);
    if (extracted) return extracted;
  }

  if (isRecord(error)) {
    const extracted = extractMessageFromPayload(error);
    if (extracted) return extracted;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return '';
};

export const toApiError = (error: unknown, fallbackMessage: string): Error => {
  const message = extractErrorMessage(error) || fallbackMessage;
  return new Error(message);
};

export const normalizeAccount = (raw: unknown): Account | null => {
  const payload = unwrapPayload(raw);
  const id = toStringValue(payload._id) || toStringValue(payload.id);
  const username = toStringValue(payload.username);
  if (!id || !username) return null;
  const autoposting = unwrapPayload(payload.autoposting_properties);

  return {
    _id: id,
    username,
    platforms: toStringArray(payload.platforms),
    is_ai: Boolean(payload.is_ai),
    autoposting_properties: {
      enabled: Boolean(autoposting.enabled),
      posting_frequency: toStringValue(autoposting.posting_frequency) || undefined,
      daily_posts: toNumberRecord(autoposting.daily_posts),
      downtime_hours: toNumberValue(autoposting.downtime_hours) ?? undefined,
      downtime_start: toStringValue(autoposting.downtime_start) || undefined,
      downtime_end: toStringValue(autoposting.downtime_end) || undefined,
    },
    scheduled_times: toStringArray(payload.scheduled_times),
  };
};

export const normalizeUser = (raw: unknown): User | null => {
  const payload = unwrapPayload(raw);
  const id = toNumberValue(payload.id);
  const username = toStringValue(payload.username);
  if (id === undefined || !username) return null;

  const accounts = Array.isArray(payload.accounts)
    ? payload.accounts
        .map((account) => normalizeAccount(account))
        .filter((account): account is Account => account !== null)
    : [];

  return {
    id,
    username,
    accounts,
  };
};

export const normalizeUsersResponse = (raw: unknown): UsersResponse => {
  const payload = unwrapPayload(raw);
  const usersRaw = Array.isArray(payload.users)
    ? payload.users
    : Array.isArray(payload.items)
      ? payload.items
      : [];

  const users = usersRaw
    .map((user) => normalizeUser(user))
    .filter((user): user is User => user !== null);

  const activeUser = normalizeUser(payload.active_user) ?? null;
  return { users, active_user: activeUser };
};

export const normalizeActiveAccount = (raw: unknown): Account | null => {
  const payload = unwrapPayload(raw);
  const direct = normalizeAccount(payload);
  if (direct) return direct;
  return normalizeAccount(payload.active_account);
};

export const normalizeScheduleResponse = (raw: unknown): ScheduleResponse => {
  const payload = unwrapPayload(raw);
  const status = toStringValue(payload.status ?? payload.run_status).toLowerCase();
  const runId = toStringValue(payload.run_id ?? payload.id);
  const scheduledDate = toStringValue(payload.scheduled_date ?? payload.scheduled_for);
  const message =
    toStringValue(payload.message) ||
    toStringValue(payload.detail) ||
    (runId && status ? `Run ${runId} is ${status}.` : '');
  const error = toStringValue(payload.error) || toStringValue(payload.reason);

  let success: boolean;
  if (typeof payload.success === 'boolean') {
    success = payload.success;
  } else if (status) {
    success = !['failed', 'error', 'cancelled', 'canceled'].includes(status);
  } else {
    success = Boolean(runId || scheduledDate || message) && !Boolean(error);
  }

  return {
    success,
    run_id: runId || undefined,
    status: status || undefined,
    message: message || undefined,
    scheduled_date: scheduledDate || undefined,
    warnings: Array.isArray(payload.warnings)
      ? payload.warnings.filter((warning): warning is string => typeof warning === 'string')
      : undefined,
    error: error || undefined,
  };
};
