import React from 'react';
import { AttachmentProvenanceItem } from '../../clips/attachmentProvenance';
import { Button } from '../../ui';
import { SceneReferenceRow, getOptionKey, toReferenceOptionLabel } from '../sceneReferenceMapping';
import { isImageReferenceOption } from './assemblyPayload';
import { readString } from './valueReaders';

interface SceneReferenceBindingRowProps {
  row: SceneReferenceRow;
  options: AttachmentProvenanceItem[];
  onSelect: (rowKey: string, selectedOptionKey: string) => void;
}

const SceneReferenceBindingRow: React.FC<SceneReferenceBindingRowProps> = ({ row, options, onSelect }) => {
  const optionMap = new Map(options.map((item) => [getOptionKey(item), item]));
  const selected = row.selectedOptionKey ? optionMap.get(row.selectedOptionKey) : undefined;
  const selectedReferenceUrl = readString(selected?.url);
  const selectedReferenceId = readString(selected?.media_id) || readString(selected?.id);

  const rowStatus = row.error
    ? row.error
    : row.required && !row.selectedOptionKey
    ? 'Missing required reference'
    : selected
    ? `Bound to ${selected.name}`
    : 'Optional scene without reference';

  return (
    <div
      key={row.key}
      className={`attachment-item ${row.required && !row.selectedOptionKey ? 'border-amber-400/40 bg-amber-500/10' : ''}`}
      data-testid={`scene-row-${row.scene_id}-${row.order}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-zinc-100">
          Scene {row.order}: <strong>{row.scene_id}</strong>
        </p>
        <span className="attachment-meta">{row.required ? 'required' : 'optional'}</span>
      </div>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <select
          value={row.selectedOptionKey}
          onChange={(event) => onSelect(row.key, event.target.value)}
          className="w-full select sm:flex-1"
          aria-label={`Scene ${row.scene_id} reference`}
        >
          <option value="">Select reference asset...</option>
          {options.map((option) => {
            const optionKey = getOptionKey(option);
            return (
              <option key={optionKey} value={optionKey}>
                {toReferenceOptionLabel(option)}
              </option>
            );
          })}
        </select>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onSelect(row.key, '')}
          disabled={!row.selectedOptionKey}
        >
          Clear
        </Button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        {selectedReferenceUrl && isImageReferenceOption(selected) ? (
          <img
            src={selectedReferenceUrl}
            alt={`Scene ${row.scene_id} reference`}
            className="w-12 h-12 rounded object-cover border border-white/20"
            loading="lazy"
            data-testid={`scene-reference-preview-${row.scene_id}-${row.order}`}
          />
        ) : (
          <div
            className="w-12 h-12 rounded border border-white/20 bg-black/50 flex items-center justify-center text-[10px] text-zinc-400 uppercase"
            data-testid={`scene-reference-preview-${row.scene_id}-${row.order}`}
          >
            No ref
          </div>
        )}

        <p className="attachment-meta">
          {selected ? `${selected.name}${selectedReferenceId ? ` · ${selectedReferenceId}` : ''}` : 'No reference'}
        </p>
      </div>

      <p className={`attachment-meta mt-2 ${row.required && !row.selectedOptionKey ? 'text-amber-100' : ''}`}>
        {rowStatus}
      </p>
    </div>
  );
};

export default SceneReferenceBindingRow;
