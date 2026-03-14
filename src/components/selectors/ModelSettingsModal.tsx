import React, { useEffect, useState, useCallback } from 'react';
import ModelsAPI from '../../api/models';
import { ModelConstraintsResponse } from '../../api/structs/model';
import { MediaOutputSpec } from '../../api/structs/media-spec';
import { Modal } from '../modals';
import { Button } from '../ui';
import { ConstraintFieldInput } from './modelSettingsFields';
import {
  getVisibleFields,
  buildDefaultSettings,
  outputSpecToSettings,
  settingsToOutputSpec,
  validateSettings,
} from './modelSettingsHelpers';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Model ID — used to fetch constraints if `constraints` prop is not provided */
  modelId: string;
  /** Display label for the modal title */
  modality: 'image' | 'video' | 'audio';
  /** Current settings (without provider/model — those are separate) */
  settings: Partial<MediaOutputSpec>;
  /** Called with updated settings on save */
  onSettingsChange: (settings: Partial<MediaOutputSpec>) => void;
  /** Optional pre-fetched constraints — skips the fetch if provided */
  constraints?: ModelConstraintsResponse;
}

const MODALITY_LABELS: Record<string, string> = {
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
};

const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  isOpen,
  onClose,
  modelId,
  modality,
  settings,
  onSettingsChange,
  constraints: externalConstraints,
}) => {
  const [fetchedConstraints, setFetchedConstraints] = useState<ModelConstraintsResponse | null>(null);
  const [localSettings, setLocalSettings] = useState<Partial<MediaOutputSpec>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use external constraints if provided, otherwise use fetched
  const constraints = externalConstraints ?? fetchedConstraints;

  // Fetch constraints when modal opens (only if not externally provided)
  useEffect(() => {
    if (!isOpen || !modelId || externalConstraints) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    ModelsAPI.getModelConstraints(modelId, modality)
      .then((data) => {
        if (cancelled) return;
        setFetchedConstraints(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(`Failed to load constraints: ${err.message}`);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, modelId, modality, externalConstraints]);

  // Merge defaults + current settings when constraints become available
  useEffect(() => {
    if (!constraints) {
      setLocalSettings(settings);
      return;
    }

    const defaults = buildDefaultSettings(constraints);
    const merged = { ...defaults, ...outputSpecToSettings(settings, constraints) };
    const validated = validateSettings(merged, constraints);
    setLocalSettings(validated);
  }, [constraints, isOpen, settings]);

  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      setLocalSettings((prev) => {
        const next = { ...prev, [key]: value };
        return constraints ? validateSettings(next, constraints) : next;
      });
    },
    [constraints]
  );

  const handleSave = () => {
    onSettingsChange(settingsToOutputSpec(localSettings));
    onClose();
  };

  const handleReset = () => {
    if (constraints) {
      const defaults = buildDefaultSettings(constraints);
      setLocalSettings(defaults);
    }
  };

  const visibleFields = constraints ? getVisibleFields(constraints) : [];
  const title = `${MODALITY_LABELS[modality] || modality} Settings`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-4">
        {/* Model info */}
        <div className="text-xs text-slate-500 bg-black/50 border border-white/10 rounded p-2 uppercase tracking-wide">
          <span className="font-medium">Model:</span> {modelId}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-slate-400 text-sm">Loading constraints...</div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-sm text-zinc-200 bg-black/50 border border-white/10 rounded p-3">
            {error}
          </div>
        )}

        {/* Fields */}
        {!isLoading && !error && visibleFields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {visibleFields.map(({ key, field }) => (
              <ConstraintFieldInput
                key={key}
                fieldKey={key}
                field={field}
                value={(localSettings as Record<string, unknown>)[key]}
                onChange={handleFieldChange}
              />
            ))}
          </div>
        )}

        {/* No fields */}
        {!isLoading && !error && visibleFields.length === 0 && constraints && (
          <div className="text-sm text-slate-500 text-center py-4">
            No configurable settings for this model.
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-2 border-t border-white/10">
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={!constraints}>
            Reset Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Apply
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ModelSettingsModal;
