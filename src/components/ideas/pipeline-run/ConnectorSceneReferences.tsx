import React from 'react';
import { AttachmentProvenanceItem } from '../../clips/attachmentProvenance';
import { createSceneReferenceRows, toSceneReferenceMappingEntries } from '../sceneReferenceMapping';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const toConnectorSceneReferenceEntries = (output: string) => {
  try {
    const parsed = JSON.parse(output);
    if (!isRecord(parsed)) return [];
    const options: AttachmentProvenanceItem[] = [];
    const rows = createSceneReferenceRows(parsed, options);
    if (rows.length === 0) return [];
    return toSceneReferenceMappingEntries(rows, options);
  } catch {
    return [];
  }
};

interface ConnectorSceneReferencesProps {
  output: string;
}

const ConnectorSceneReferences: React.FC<ConnectorSceneReferencesProps> = ({ output }) => {
  const entries = React.useMemo(() => toConnectorSceneReferenceEntries(output), [output]);

  if (entries.length === 0) return null;

  return (
    <div className="attachment-surface space-y-2">
      <p className="attachment-state">Scene References</p>
      {entries.map((entry) => (
        <div key={`${entry.scene_id}-${entry.order}`} className="attachment-item space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-zinc-100">
              Scene {entry.order}: <strong>{entry.scene_id}</strong>
            </p>
            <span className="attachment-meta">
              {entry.status === 'resolved' ? 'resolved' : 'missing'}
            </span>
          </div>
          <p className="attachment-meta">
            {entry.reference_name || entry.reference_media_id || entry.reference_id || 'No bound reference'}
          </p>
          {entry.reference_url && <p className="attachment-meta break-all">{entry.reference_url}</p>}
        </div>
      ))}
    </div>
  );
};

export default ConnectorSceneReferences;
