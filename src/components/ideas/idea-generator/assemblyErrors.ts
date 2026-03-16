import { SceneReferenceRow } from '../sceneReferenceMapping';
import { isPlainObject, readFiniteNumber, readString } from './valueReaders';

export const getBlockingReferenceCount = (rows: SceneReferenceRow[]): number =>
  rows.filter((row) => row.required && (!row.selectedOptionKey || Boolean(row.error))).length;

export const toAssemblyErrorMessage = (error: unknown): string => {
  const record = error as
    | {
        response?: {
          data?: {
            error?: string;
            message?: string;
          };
        };
        message?: string;
      }
    | undefined;

  return (
    record?.response?.data?.error ||
    record?.response?.data?.message ||
    record?.message ||
    'Failed to assemble clip prompt.'
  );
};

const extractMissingRows = (value: unknown): unknown[] => {
  if (!isPlainObject(value)) return [];
  const candidate =
    value.missing_required_references ??
    value.missing_required_scene_references ??
    value.missing_references ??
    value.unresolved_scenes;
  return Array.isArray(candidate) ? candidate : [];
};

export const extractMissingSceneErrors = (
  error: unknown
): { byKey: Record<string, string>; unresolvedCount: number } => {
  const payload = (error as { response?: { data?: unknown } })?.response?.data;
  const rows = [
    ...extractMissingRows(payload),
    ...(isPlainObject(payload) ? extractMissingRows(payload.details) : []),
  ];

  const byKey: Record<string, string> = {};

  rows.forEach((raw, index) => {
    if (!isPlainObject(raw)) return;

    const sceneId = readString(raw.scene_id ?? raw.sceneId ?? raw.id) || `scene-${index + 1}`;
    const order = Math.max(
      1,
      readFiniteNumber(raw.order ?? raw.scene_order ?? raw.sceneOrder ?? raw.index, index + 1)
    );
    const message =
      readString(raw.error ?? raw.message ?? raw.reason) ||
      'Required reference is unresolved for this scene.';

    byKey[`${sceneId}::${order}`] = message;
  });

  const unresolvedValue = isPlainObject(payload)
    ? payload.unresolved_count ?? payload.unresolvedCount
    : undefined;
  const unresolvedCount = Math.max(
    Object.keys(byKey).length,
    Number.isFinite(Number(unresolvedValue)) ? Number(unresolvedValue) : 0
  );

  return { byKey, unresolvedCount };
};
