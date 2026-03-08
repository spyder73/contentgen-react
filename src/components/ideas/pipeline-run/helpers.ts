import { CheckpointConfig, PipelineRun } from '../../../api/structs';
import { CheckpointInjectionMode, MediaAttachment } from '../../../api/structs/pipeline';
import { AssetPoolItem } from '../assetPool';

const DEFAULT_MIME_TYPE = 'application/octet-stream';

export const formatMetadataValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null) return 'null';
  if (value === undefined) return '';

  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
};

export const toActionableErrorMessage = (error: unknown, fallbackMessage: string): string => {
  const record = error as
    | {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      }
    | undefined;
  return (
    record?.response?.data?.error ||
    record?.response?.data?.message ||
    record?.message ||
    fallbackMessage
  );
};

export const toAttachmentRequest = (asset: AssetPoolItem): Omit<MediaAttachment, 'id' | 'created_at'> => ({
  media_id: asset.media_id,
  type: asset.type || asset.kind || 'file',
  url: asset.url || '',
  mime_type: asset.mime_type || DEFAULT_MIME_TYPE,
  name: asset.name || asset.media_id || asset.id,
  filename: asset.name || asset.media_id || asset.id,
  size_bytes: asset.size_bytes,
  metadata: {
    ...(asset.metadata || {}),
    source: asset.source,
    source_run_id: asset.run_id,
    source_checkpoint_id: asset.checkpoint_id,
    source_checkpoint_index: asset.checkpoint_index,
    reused_from_asset_pool: true,
  },
});

export const modeLabel = (mode: CheckpointInjectionMode): string =>
  mode === 'with_prior_output_context' ? 'Guidance + prior output context' : 'Guidance only';

export const formatOutput = (output: string): string => {
  try {
    const parsed = JSON.parse(output);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return output;
  }
};

export const getCheckpointType = (template: { checkpoints: CheckpointConfig[] }, index: number): CheckpointConfig['type'] | 'prompt' => {
  return template.checkpoints[index]?.type || 'prompt';
};

export const getFanInSources = (checkpoints: CheckpointConfig[], index: number): string[] => {
  const checkpoint = checkpoints[index];
  if (!checkpoint) return [];

  if ((checkpoint.type || 'prompt') !== 'connector') {
    return [];
  }

  const configuredSource = checkpoint.connector?.source_checkpoint_id;
  if (configuredSource) {
    const source = checkpoints.find((item) => item.id === configuredSource);
    if ((source?.type || 'prompt') === 'distributor') {
      return [configuredSource];
    }
  }

  for (let i = index - 1; i >= 0; i--) {
    const candidate = checkpoints[i];
    if ((candidate?.type || 'prompt') === 'distributor') {
      return [candidate.id];
    }
  }
  return [];
};

export const getReusableAssetsForCheckpoint = (
  reusablePoolAssets: AssetPoolItem[],
  checkpointIndex: number
): AssetPoolItem[] =>
  reusablePoolAssets.filter((asset) => {
    if (asset.checkpoint_index === undefined || asset.checkpoint_index === null) return true;
    return asset.checkpoint_index < checkpointIndex;
  });

export const getRunProgressPercent = (run: PipelineRun, checkpointCount: number): number => {
  const isTerminal = ['completed', 'failed', 'cancelled'].includes(run.status);
  const total = checkpointCount || 1;
  if (isTerminal) return 100;
  return Math.round((run.current_checkpoint / total) * 100);
};

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

const COST_PROVIDERS = ['runware', 'openrouter'] as const;
const RUN_COST_KEYS = ['total_cost', 'run_cost', 'cost', 'amount', 'total', 'run_total', 'total_usd'];
const PER_CLIP_KEYS = ['per_clip', 'per_clip_cost', 'clip_cost', 'cost_per_clip'];
const CLIP_COUNT_KEYS = ['clip_count', 'clips', 'count'];
const ESTIMATED_KEYS = ['estimated', 'is_estimated', 'estimated_cost', 'cost_estimated'];
const CURRENCY_KEYS = ['currency', 'currency_code', 'cost_currency'];

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

const collectProviderRecords = (
  provider: string,
  summary: Record<string, unknown>
): Array<Record<string, unknown>> => {
  const records: Array<Record<string, unknown>> = [];
  const topLevel = asRecord(summary[provider]);
  if (topLevel) records.push(topLevel);

  const containerKeys = ['providers', 'per_run', 'per_clip', 'provider_costs', 'costs', 'pricing'];
  containerKeys.forEach((key) => {
    const container = asRecord(summary[key]);
    const entry = container ? asRecord(container[provider]) : null;
    if (entry) {
      records.push(entry);
    }
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
  if (!summary) return null;

  const baseEstimated =
    pickFirstBoolean([summary], ESTIMATED_KEYS) || false;
  const baseCurrency =
    pickFirstString([summary], CURRENCY_KEYS) || 'USD';

  const runLines: PricingLine[] = [];
  const perClipLines: PricingLine[] = [];

  COST_PROVIDERS.forEach((provider) => {
    const providerRecords = collectProviderRecords(provider, summary);
    if (providerRecords.length === 0) return;

    const runValue = pickFirstNumber(providerRecords, RUN_COST_KEYS);
    const perClipValue = pickFirstNumber(providerRecords, PER_CLIP_KEYS);
    const clipCount = pickFirstNumber(providerRecords, CLIP_COUNT_KEYS);
    const estimated = pickFirstBoolean(providerRecords, ESTIMATED_KEYS) ?? baseEstimated;
    const currency = pickFirstString(providerRecords, CURRENCY_KEYS) || baseCurrency;

    if (runValue !== undefined) {
      runLines.push({
        provider,
        value: runValue,
        currency,
        estimated,
      });
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
  return {
    run: runLines,
    perClip: perClipLines,
    hasEstimated,
  };
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
