import { MediaType } from './structs';
import { isRecord } from './typeHelpers';

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

export const createEmptyClipStyleSchema = (
  styleId: string,
  styleSummary?: ClipStyleSummary
): ClipStyleSchema => ({
  id: styleId,
  name: styleSummary?.name || styleId,
  description: styleSummary?.description || '',
  metadataFields: [],
  mediaMetadataFields: {
    image: [],
    ai_video: [],
    audio: [],
  },
});

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
  if (type === 'array') return 'textarea';
  return hasOptions ? 'select' : 'text';
};

const normalizeFieldOptions = (raw: unknown): ClipStyleFieldOption[] | undefined => {
  if (!Array.isArray(raw)) return undefined;

  const options = raw
    .map((item): ClipStyleFieldOption | null => {
      if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
        const value = String(item);
        return { value, label: value };
      }

      if (!isRecord(item)) return null;

      const value =
        toStringOrEmpty(item.const) ||
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

const normalizeRequiredSet = (raw: unknown): Set<string> => {
  if (!Array.isArray(raw)) return new Set();

  return new Set(
    raw
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  );
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

      const options = normalizeFieldOptions(
        item.options ?? item.enum ?? item.choices ?? item.oneOf ?? item.anyOf
      );

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

const normalizeJsonSchemaFields = (
  rawProperties: unknown,
  rawRequired: unknown
): ClipStyleField[] => {
  if (!isRecord(rawProperties)) return [];

  const required = normalizeRequiredSet(rawRequired);

  return Object.entries(rawProperties)
    .map(([key, value]): ClipStyleField | null => {
      if (!isRecord(value)) return null;

      const options = normalizeFieldOptions(
        value.enum ??
          value.options ??
          value.choices ??
          value.oneOf ??
          value.anyOf ??
          (isRecord(value.items)
            ? value.items.enum ?? value.items.oneOf ?? value.items.anyOf
            : undefined)
      );

      const explicitType = value.type ?? (isRecord(value.items) ? value.items.type : undefined);
      const inferredType =
        typeof value.widget === 'string' && value.widget.toLowerCase() === 'textarea'
          ? 'textarea'
          : normalizeFieldType(explicitType, Boolean(options));

      return {
        key,
        label: toStringOrEmpty(value.title) || toStringOrEmpty(value.label) || humanize(key),
        type: inferredType,
        placeholder: toStringOrEmpty(value.placeholder) || undefined,
        description: toStringOrEmpty(value.description) || undefined,
        options,
        required: required.has(key) || Boolean(value.required),
        defaultValue:
          value.default_value !== undefined ? value.default_value : value.default,
      };
    })
    .filter((field): field is ClipStyleField => Boolean(field));
};

const mergeClipStyleFields = (...fieldGroups: ClipStyleField[][]): ClipStyleField[] => {
  const merged = new Map<string, ClipStyleField>();

  fieldGroups.flat().forEach((field) => {
    const existing = merged.get(field.key);
    if (!existing) {
      merged.set(field.key, field);
      return;
    }

    const existingLooksFallback = existing.label === humanize(existing.key);
    const nextLooksFallback = field.label === humanize(field.key);
    const shouldUseIncomingType = existing.type === 'text' && field.type !== 'text';

    merged.set(field.key, {
      ...existing,
      label:
        !existing.label || (existingLooksFallback && !nextLooksFallback)
          ? field.label
          : existing.label,
      type: shouldUseIncomingType ? field.type : existing.type,
      placeholder: existing.placeholder ?? field.placeholder,
      description: existing.description ?? field.description,
      options: existing.options ?? field.options,
      required: Boolean(existing.required || field.required),
      defaultValue:
        existing.defaultValue !== undefined ? existing.defaultValue : field.defaultValue,
    });
  });

  return Array.from(merged.values());
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

  const descriptorFields = normalizeFieldsArray(
    schema.metadata_fields ??
      schema.metadataFields ??
      schema.clip_metadata_fields ??
      schema.clipMetadataFields ??
      schema.fields ??
      record.metadata_fields ??
      record.metadataFields ??
      record.clip_metadata_fields ??
      record.clipMetadataFields ??
      record.fields
  );

  const jsonSchemaFields = normalizeJsonSchemaFields(
    schema.properties ??
      (isRecord(schema.metadata_schema) ? schema.metadata_schema.properties : undefined) ??
      record.properties ??
      (isRecord(record.metadata_schema) ? record.metadata_schema.properties : undefined),
    schema.required ??
      (isRecord(schema.metadata_schema) ? schema.metadata_schema.required : undefined) ??
      record.required ??
      (isRecord(record.metadata_schema) ? record.metadata_schema.required : undefined)
  );
  const metadataFields = mergeClipStyleFields(descriptorFields, jsonSchemaFields);

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
