import { PipelineRun } from '../../../api/structs';

interface PricingLine {
  provider: string;
  value: number;
  currency: string;
  estimated: boolean;
  clipCount?: number;
}

export interface PricingSummaryView {
  run: PricingLine[];
  perClip: PricingLine[];
  hasEstimated: boolean;
}

const RUN_COST_KEYS = ['total_cost', 'run_cost', 'cost', 'amount', 'total', 'run_total', 'total_usd'];
const PER_CLIP_KEYS = ['per_clip', 'per_clip_cost', 'clip_cost', 'cost_per_clip'];
const CLIP_COUNT_KEYS = ['clip_count', 'clips', 'count'];
const ESTIMATED_KEYS = ['estimated', 'is_estimated', 'estimated_cost', 'cost_estimated'];
const CURRENCY_KEYS = ['currency', 'currency_code', 'cost_currency'];
const COST_CONTAINER_KEYS = ['providers', 'per_run', 'per_clip', 'provider_costs', 'costs', 'pricing'];

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const readBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return undefined;
};

const pickFirstNumber = (records: Array<Record<string, unknown>>, keys: string[]): number | undefined => {
  for (const record of records) {
    for (const key of keys) {
      const parsed = readNumber(record[key]);
      if (parsed !== undefined) return parsed;
    }
  }
  return undefined;
};

const pickFirstString = (records: Array<Record<string, unknown>>, keys: string[]): string | undefined => {
  for (const record of records) {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return undefined;
};

const pickFirstBoolean = (records: Array<Record<string, unknown>>, keys: string[]): boolean | undefined => {
  for (const record of records) {
    for (const key of keys) {
      const parsed = readBoolean(record[key]);
      if (parsed !== undefined) return parsed;
    }
  }
  return undefined;
};

const collectProviderKeys = (summary: Record<string, unknown>): string[] => {
  const keys = new Set<string>();

  COST_CONTAINER_KEYS.forEach((containerKey) => {
    const container = asRecord(summary[containerKey]);
    if (!container) return;
    Object.keys(container).forEach((provider) => keys.add(provider));
  });

  Object.entries(summary).forEach(([key, value]) => {
    if (COST_CONTAINER_KEYS.includes(key)) return;
    if (!asRecord(value)) return;
    if (['metadata', 'totals'].includes(key)) return;
    keys.add(key);
  });

  if (Array.isArray(summary.clips)) {
    summary.clips.forEach((clip) => {
      const clipRecord = asRecord(clip);
      if (!clipRecord) return;
      const provider = String(clipRecord.provider || clipRecord.vendor || '').trim();
      if (provider) keys.add(provider);
      Object.keys(clipRecord)
        .filter((key) => asRecord(clipRecord[key]))
        .forEach((key) => keys.add(key));
    });
  }

  return Array.from(keys);
};

const collectProviderRecords = (
  provider: string,
  summary: Record<string, unknown>
): Array<Record<string, unknown>> => {
  const records: Array<Record<string, unknown>> = [];
  const topLevel = asRecord(summary[provider]);
  if (topLevel) records.push(topLevel);

  COST_CONTAINER_KEYS.forEach((key) => {
    const container = asRecord(summary[key]);
    const entry = container ? asRecord(container[provider]) : null;
    if (entry) records.push(entry);
  });

  const lowerProvider = provider.toLowerCase();
  if (Array.isArray(summary.clips)) {
    const clipTotals = summary.clips.reduce(
      (acc, clipItem) => {
        const clipRecord = asRecord(clipItem);
        if (!clipRecord) return acc;

        const directProvider = asRecord(clipRecord[lowerProvider]) || asRecord(clipRecord[provider]);
        if (directProvider) {
          const amount = pickFirstNumber([directProvider], RUN_COST_KEYS);
          if (amount !== undefined) {
            acc.total += amount;
            acc.count += 1;
          }
          return acc;
        }

        const name = String(clipRecord.provider || clipRecord.vendor || '').toLowerCase();
        if (name !== lowerProvider) return acc;
        const amount = pickFirstNumber([clipRecord], RUN_COST_KEYS);
        if (amount !== undefined) {
          acc.total += amount;
          acc.count += 1;
        }
        return acc;
      },
      { total: 0, count: 0 }
    );

    if (clipTotals.count > 0) {
      records.push({
        per_clip_cost: clipTotals.total / clipTotals.count,
        clip_count: clipTotals.count,
        total_cost: clipTotals.total,
      });
    }
  }

  return records;
};

export const parsePricingSummary = (run: PipelineRun): PricingSummaryView | null => {
  const summary = asRecord(run.cost_summary);
  if (!summary) {
    const runRecord = asRecord(run as unknown);
    const costRecord = runRecord ? asRecord(runRecord.cost) : null;
    const totalUsd = costRecord ? pickFirstNumber([costRecord], ['total_usd']) : undefined;
    if (totalUsd === undefined) return null;
    return {
      run: [{ provider: 'total', value: totalUsd, currency: 'USD', estimated: false }],
      perClip: [],
      hasEstimated: false,
    };
  }

  const baseEstimated = pickFirstBoolean([summary], ESTIMATED_KEYS) || false;
  const baseCurrency = pickFirstString([summary], CURRENCY_KEYS) || 'USD';

  const runLines: PricingLine[] = [];
  const perClipLines: PricingLine[] = [];
  const providerKeys = collectProviderKeys(summary);

  providerKeys.forEach((provider) => {
    const providerRecords = collectProviderRecords(provider, summary);
    if (providerRecords.length === 0) return;

    const runValue = pickFirstNumber(providerRecords, RUN_COST_KEYS);
    const perClipValue = pickFirstNumber(providerRecords, PER_CLIP_KEYS);
    const clipCount = pickFirstNumber(providerRecords, CLIP_COUNT_KEYS);
    const estimated = pickFirstBoolean(providerRecords, ESTIMATED_KEYS) ?? baseEstimated;
    const currency = pickFirstString(providerRecords, CURRENCY_KEYS) || baseCurrency;

    if (runValue !== undefined) {
      runLines.push({ provider, value: runValue, currency, estimated });
    }

    if (perClipValue !== undefined) {
      perClipLines.push({
        provider,
        value: perClipValue,
        currency,
        estimated,
        clipCount: clipCount !== undefined ? Math.max(0, Math.floor(clipCount)) : undefined,
      });
    } else if (runValue !== undefined && clipCount !== undefined && clipCount > 0) {
      perClipLines.push({
        provider,
        value: runValue / clipCount,
        currency,
        estimated,
        clipCount: Math.max(0, Math.floor(clipCount)),
      });
    }
  });

  if (runLines.length === 0 && perClipLines.length === 0) return null;
  const hasEstimated = baseEstimated || [...runLines, ...perClipLines].some((line) => line.estimated);
  return { run: runLines, perClip: perClipLines, hasEstimated };
};

export const formatCost = (value: number, currency = 'USD'): string => {
  const normalizedCurrency = currency.trim().toUpperCase() || 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  } catch {
    return `${value.toFixed(4)} ${normalizedCurrency}`;
  }
};
