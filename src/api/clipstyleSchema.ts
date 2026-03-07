import { MediaType } from './structs';

export type ClipStyleFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'select-media'
  | 'number'
  | 'checkbox';

export interface ClipStyleFieldOption {
  value: string;
  label: string;
}

export interface ClipStyleField {
  key: string;
  label: string;
  type: ClipStyleFieldType;
  placeholder?: string;
  description?: string;
  options?: ClipStyleFieldOption[];
  required?: boolean;
  defaultValue?: unknown;
}

export interface ClipStyleSummary {
  id: string;
  name: string;
  description: string;
}

export interface ClipStyleSchema {
  id: string;
  name: string;
  description: string;
  metadataFields: ClipStyleField[];
  mediaMetadataFields: Record<MediaType, ClipStyleField[]>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toStringOrEmpty = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const humanize = (id: string): string =>
  id
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || id;

const normalizeStyleSummary = (raw: unknown): ClipStyleSummary | null => {
  if (typeof raw === 'string') {
    return {
      id: raw,
      name: humanize(raw),
      description: '',
    };
  }

  if (!isRecord(raw)) return null;

  const id =
    toStringOrEmpty(raw.id) ||
    toStringOrEmpty(raw.style) ||
    toStringOrEmpty(raw.style_id) ||
    toStringOrEmpty(raw.key);

  if (!id) return null;

  return {
    id,
    name:
      toStringOrEmpty(raw.name) ||
      toStringOrEmpty(raw.display_name) ||
      toStringOrEmpty(raw.title) ||
      humanize(id),
    description: toStringOrEmpty(raw.description) || toStringOrEmpty(raw.details),
  };
};

export const normalizeClipStyleList = (payload: unknown): ClipStyleSummary[] => {
  let rawList: unknown[] = [];

  if (Array.isArray(payload)) {
    rawList = payload;
  } else if (isRecord(payload)) {
    if (Array.isArray(payload.styles)) rawList = payload.styles;
    else if (Array.isArray(payload.clipstyles)) rawList = payload.clipstyles;
    else if (Array.isArray(payload.items)) rawList = payload.items;
    else if (Array.isArray(payload.data)) rawList = payload.data;
  }

  const normalized = rawList
    .map(normalizeStyleSummary)
    .filter((style): style is ClipStyleSummary => Boolean(style));

  const deduped = new Map<string, ClipStyleSummary>();
  normalized.forEach((style) => {
    if (!deduped.has(style.id)) deduped.set(style.id, style);
  });

  return Array.from(deduped.values());
};

const normalizeFieldType = (raw: unknown, hasOptions: boolean): ClipStyleFieldType => {
  if (typeof raw !== 'string') return hasOptions ? 'select' : 'text';

  const type = raw.toLowerCase();
  if (type === 'textarea' || type === 'multiline') return 'textarea';
  if (type === 'select' || type === 'enum' || type === 'dropdown') return 'select';
  if (type === 'select-media' || type === 'media_select') return 'select-media';
  if (type === 'number' || type === 'int' || type === 'integer' || type === 'float') return 'number';
  if (type === 'boolean' || type === 'bool' || type === 'checkbox') return 'checkbox';
  return hasOptions ? 'select' : 'text';
};

const normalizeFieldOptions = (raw: unknown): ClipStyleFieldOption[] | undefined => {
  if (!Array.isArray(raw)) return undefined;

  const options = raw
    .map((item): ClipStyleFieldOption | null => {
      if (typeof item === 'string' || typeof item === 'number') {
        const value = String(item);
        return { value, label: value };
      }

      if (!isRecord(item)) return null;

      const value =
        toStringOrEmpty(item.value) ||
        toStringOrEmpty(item.id) ||
        toStringOrEmpty(item.key) ||
        toStringOrEmpty(item.name);

      if (!value) return null;

      return {
        value,
        label: toStringOrEmpty(item.label) || toStringOrEmpty(item.name) || value,
      };
    })
    .filter((item): item is ClipStyleFieldOption => Boolean(item));

  return options.length > 0 ? options : undefined;
};

const normalizeFieldsArray = (raw: unknown): ClipStyleField[] => {
  if (!raw) return [];

  const rows: Array<[string | null, unknown]> = [];

  if (Array.isArray(raw)) {
    raw.forEach((item) => rows.push([null, item]));
  } else if (isRecord(raw)) {
    Object.entries(raw).forEach(([key, value]) => rows.push([key, value]));
  }

  return rows
    .map(([fallbackKey, item]): ClipStyleField | null => {
      if (typeof item === 'string') {
        return {
          key: fallbackKey || item,
          label: humanize(fallbackKey || item),
          type: 'text',
        };
      }

      if (!isRecord(item)) return null;

      const key =
        toStringOrEmpty(item.key) ||
        toStringOrEmpty(item.id) ||
        fallbackKey ||
        '';

      if (!key) return null;

      const options = normalizeFieldOptions(item.options ?? item.enum ?? item.choices);

      const inferredType =
        typeof item.widget === 'string' && item.widget.toLowerCase() === 'textarea'
          ? 'textarea'
          : normalizeFieldType(item.type ?? item.input_type, Boolean(options));

      return {
        key,
        label: toStringOrEmpty(item.label) || humanize(key),
        type: inferredType,
        placeholder: toStringOrEmpty(item.placeholder) || undefined,
        description: toStringOrEmpty(item.description) || undefined,
        options,
        required: Boolean(item.required),
        defaultValue:
          item.default_value !== undefined ? item.default_value : item.default,
      };
    })
    .filter((field): field is ClipStyleField => Boolean(field));
};

const toMediaType = (value: string): MediaType | null => {
  if (value === 'image' || value === 'images') return 'image';
  if (value === 'ai_video' || value === 'video' || value === 'videos' || value === 'ai_videos') {
    return 'ai_video';
  }
  if (value === 'audio' || value === 'audios') return 'audio';
  return null;
};

const normalizeMediaFields = (raw: unknown): Record<MediaType, ClipStyleField[]> => {
  const base: Record<MediaType, ClipStyleField[]> = {
    image: [],
    ai_video: [],
    audio: [],
  };

  if (!isRecord(raw)) return base;

  Object.entries(raw).forEach(([key, value]) => {
    const mediaType = toMediaType(key);
    if (!mediaType) return;
    base[mediaType] = normalizeFieldsArray(value);
  });

  return base;
};

export const normalizeClipStyleSchema = (
  styleId: string,
  payload: unknown,
  summary?: ClipStyleSummary
): ClipStyleSchema => {
  const record = isRecord(payload) ? payload : {};
  const schema = isRecord(record.schema) ? record.schema : record;

  const metadataFields = normalizeFieldsArray(
    schema.metadata_fields ?? schema.metadataFields ?? schema.fields
  );

  const mediaMetadataFields = normalizeMediaFields(
    schema.media_metadata_fields ?? schema.mediaMetadataFields ?? schema.media_fields
  );

  const resolvedId =
    toStringOrEmpty(schema.id) ||
    toStringOrEmpty(schema.style) ||
    toStringOrEmpty(schema.style_id) ||
    summary?.id ||
    styleId;

  return {
    id: resolvedId,
    name:
      toStringOrEmpty(schema.name) ||
      toStringOrEmpty(schema.display_name) ||
      summary?.name ||
      humanize(resolvedId),
    description:
      toStringOrEmpty(schema.description) ||
      summary?.description ||
      '',
    metadataFields,
    mediaMetadataFields,
  };
};
