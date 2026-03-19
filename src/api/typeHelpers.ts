/**
 * Shared type-guard and coercion helpers.
 *
 * Every file that needs runtime type narrowing for unknown API payloads should
 * import from here instead of defining local copies.
 */

/** Narrows `unknown` to a plain object record (excludes arrays). */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Coerce an unknown value to a string.
 *
 * Two calling conventions:
 *  - `toStringValue(val)` — trims strings, coerces numbers, returns `''` otherwise.
 *  - `toStringValue(val, fallback)` — returns value as-is for strings (no trim),
 *    falls back for null/undefined, uses `String()` for everything else.
 *    This variant is used by API boundary code that must preserve whitespace.
 */
export function toStringValue(value: unknown): string;
export function toStringValue(value: unknown, fallback: string): string;
export function toStringValue(value: unknown, fallback?: string): string {
  // If a fallback was explicitly provided, use the "API boundary" path
  // that preserves whitespace and coerces via String().
  if (fallback !== undefined) {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return fallback;
    return String(value);
  }

  // Default "component" path — trims strings, coerces numbers.
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

/** Parse an unknown value into a finite number, or `undefined`. */
export const toNumberValue = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

/** Return a trimmed non-empty string or `undefined`. */
export const cleanString = (value: unknown): string | undefined => {
  const cleaned = toStringValue(value).trim();
  return cleaned || undefined;
};
