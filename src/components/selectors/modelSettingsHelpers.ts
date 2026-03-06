import { ConstraintField, ModelConstraintsResponse } from '../../api/structs/model';
import { MediaOutputSpec } from '../../api/structs/media-spec';

// ==================== Field metadata ====================

/** Display-friendly labels for known spec fields */
const FIELD_LABELS: Record<string, string> = {
  dimensions: 'Dimensions',
  width: 'Width',
  height: 'Height',
  steps: 'Steps',
  cfg_scale: 'CFG Scale',
  duration: 'Duration (s)',
  fps: 'FPS',
  seed: 'Seed',
  scheduler: 'Scheduler',
  clip_skip: 'CLIP Skip',
  prompt_weighting: 'Prompt Weighting',
  negative_prompt: 'Negative Prompt',
  denoise: 'Denoise Strength',
  guidance: 'Guidance',
};

/** Fields that should be hidden from the settings UI */
const HIDDEN_FIELDS = new Set([
  'provider',
  'model',
  'prompt',
  'lora',
  'frameImages',
  'referenceImages',
]);

// ==================== Helpers ====================

/**
 * Get a display label for a constraint field key.
 */
export function getFieldLabel(key: string): string {
  return FIELD_LABELS[key] || key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Check if a field should be shown in the settings UI.
 */
export function isVisibleField(key: string): boolean {
  return !HIDDEN_FIELDS.has(key);
}

/**
 * Get all visible fields from a constraints response, sorted by a sensible order.
 */
export function getVisibleFields(
  constraints: ModelConstraintsResponse
): Array<{ key: string; field: ConstraintField }> {
  if (!constraints.fields) return [];

  const ORDER = [
    'dimensions', 'width', 'height', 'steps', 'cfg_scale', 'guidance',
    'duration', 'fps', 'seed', 'scheduler', 'clip_skip',
    'prompt_weighting', 'denoise', 'negative_prompt',
  ];

  const entries = Object.entries(constraints.fields)
    .filter(([key]) => isVisibleField(key))
    .map(([key, field]) => ({ key, field }));

  entries.sort((a, b) => {
    const ai = ORDER.indexOf(a.key);
    const bi = ORDER.indexOf(b.key);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.key.localeCompare(b.key);
  });

  return entries;
}

/**
 * Clamp a numeric value to the constraint's min/max.
 */
export function clampToConstraint(value: number, field: ConstraintField): number {
  let v = value;
  if (field.min !== undefined && v < field.min) v = field.min;
  if (field.max !== undefined && v > field.max) v = field.max;
  if (field.type === 'integer') v = Math.round(v);
  return v;
}

/**
 * Get a sensible default value for a constraint field.
 */
export function getFieldDefault(field: ConstraintField): unknown {
  if (field.default !== undefined) return field.default;
  if (field.enum && field.enum.length > 0) return field.enum[0];
  if (field.type === 'number' || field.type === 'integer') {
    return field.min ?? 0;
  }
  if (field.type === 'boolean') return false;
  if (field.type === 'string') return '';
  return undefined;
}

/**
 * Build a default settings object from constraints.
 */
export function buildDefaultSettings(
  constraints: ModelConstraintsResponse
): Partial<MediaOutputSpec> {
  const settings: Record<string, unknown> = {};

  if (constraints.defaults) {
    Object.assign(settings, constraints.defaults);
  }

  if (constraints.fields) {
    for (const [key, field] of Object.entries(constraints.fields)) {
      if (HIDDEN_FIELDS.has(key)) continue;
      if (settings[key] === undefined) {
        const def = getFieldDefault(field);
        if (def !== undefined) settings[key] = def;
      }
    }
  }

  return settings as Partial<MediaOutputSpec>;
}

/**
 * Validate and clamp current settings against constraints.
 * Returns a new settings object with out-of-range values fixed.
 */
export function validateSettings(
  settings: Partial<MediaOutputSpec>,
  constraints: ModelConstraintsResponse
): Partial<MediaOutputSpec> {
  if (!constraints.fields) return settings;

  const validKeys = new Set(Object.keys(constraints.fields));
  const result: Record<string, unknown> = {};

  // Only keep keys that exist in constraints.fields
  for (const [key, value] of Object.entries(settings)) {
    if (!validKeys.has(key)) continue;
    result[key] = value;
  }

  // Clamp and validate remaining values
  for (const [key, field] of Object.entries(constraints.fields)) {
    const value = result[key];
    if (value === undefined) continue;

    if (
      (field.type === 'number' || field.type === 'integer') &&
      typeof value === 'number'
    ) {
      result[key] = clampToConstraint(value, field);
    }

    if (field.enum && !field.enum.includes(value as string | number | boolean)) {
      result[key] = field.enum[0];
    }
  }

  return result as Partial<MediaOutputSpec>;
}

/**
 * Split a "WxH" dimensions value into { width, height }.
 * Returns undefined if the value is not a valid dimensions string.
 */
export function parseDimensions(value: unknown): { width: number; height: number } | undefined {
  if (typeof value !== 'string') return undefined;
  const parts = value.split('x');
  if (parts.length !== 2) return undefined;
  const width = parseInt(parts[0], 10);
  const height = parseInt(parts[1], 10);
  if (isNaN(width) || isNaN(height)) return undefined;
  return { width, height };
}

/**
 * Convert local settings (which may contain "dimensions" string) into
 * a MediaOutputSpec-ready object with numeric width/height.
 */
export function settingsToOutputSpec(
  settings: Partial<MediaOutputSpec>
): Partial<MediaOutputSpec> {
  const { dimensions, ...rest } = settings as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  // Only include meaningful values — skip noise defaults
  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined || value === null) continue;
    if (value === '' && key === 'negative_prompt') continue;
    if (value === 0 && key === 'seed') continue;
    out[key] = value;
  }

  if (dimensions) {
    const parsed = parseDimensions(dimensions);
    if (parsed) {
      out.width = parsed.width;
      out.height = parsed.height;
    }
  }

  return out as Partial<MediaOutputSpec>;
}