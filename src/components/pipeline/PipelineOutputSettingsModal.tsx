import React from 'react';
import ModelsAPI from '../../api/models';
import { ModelConstraintsResponse } from '../../api/structs/model';
import { MediaOutputSpec } from '../../api/structs/media-spec';
import { Modal } from '../modals';
import CheckpointProviderSelector from '../selectors/CheckpointProviderSelector';
import { ConstraintFieldInput } from '../selectors/modelSettingsFields';
import { buildDefaultSettings, getVisibleFields, validateSettings } from '../selectors/modelSettingsHelpers';
import { Button } from '../ui';

interface PipelineOutputSettingsModalProps {
  isOpen: boolean;
  modality: 'image' | 'video' | 'audio';
  provider?: string;
  model?: string;
  settings: Partial<MediaOutputSpec>;
  requireSeedImageSupport?: boolean;
  onClose: () => void;
  onApply: (payload: {
    provider?: string;
    model?: string;
    settings?: Partial<MediaOutputSpec>;
  }) => void;
}

const MODALITY_LABELS = {
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
};

const PipelineOutputSettingsModal: React.FC<PipelineOutputSettingsModalProps> = ({
  isOpen,
  modality,
  provider,
  model,
  settings,
  requireSeedImageSupport = false,
  onClose,
  onApply,
}) => {
  const [localProvider, setLocalProvider] = React.useState(provider || '');
  const [localModel, setLocalModel] = React.useState(model || '');
  const [localSettings, setLocalSettings] = React.useState<Partial<MediaOutputSpec>>(settings);
  const [constraints, setConstraints] = React.useState<ModelConstraintsResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setLocalProvider(provider || '');
    setLocalModel(model || '');
    setLocalSettings(settings || {});
  }, [isOpen, provider, model, settings]);

  React.useEffect(() => {
    if (!isOpen || !localModel) {
      setConstraints(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    ModelsAPI.getModelConstraints(localModel, modality)
      .then((response) => {
        if (!cancelled) {
          setConstraints(response);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setConstraints(null);
          setError(`Failed to load constraints: ${err.message}`);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, localModel, modality]);

  React.useEffect(() => {
    if (!constraints) return;
    const defaults = buildDefaultSettings(constraints);
    setLocalSettings((current) => validateSettings({ ...defaults, ...current }, constraints));
  }, [constraints]);

  const visibleFields = constraints ? getVisibleFields(constraints) : [];
  const title = `${MODALITY_LABELS[modality]} Defaults`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-4">
        <CheckpointProviderSelector
          provider={localProvider}
          model={localModel}
          modality={modality}
          allowInherit
          inheritLabel="No template override"
          allowManualModelInput={modality === 'audio'}
          requireSeedImageSupport={modality === 'image' && requireSeedImageSupport}
          providerAriaLabel={`${MODALITY_LABELS[modality]} default provider`}
          modelAriaLabel={`${MODALITY_LABELS[modality]} default model`}
          onProviderChange={(value) => {
            setLocalProvider(value);
            setLocalModel('');
            setLocalSettings({});
          }}
          onModelChange={(value) => {
            setLocalModel(value);
            setLocalSettings({});
          }}
        />

        <div className="rounded border border-white/10 bg-black/40 px-3 py-2 text-xs uppercase tracking-wide text-slate-500">
          <span className="font-medium">Model:</span> {localModel || 'No model selected'}
        </div>

        {isLoading && <div className="py-8 text-center text-sm text-slate-400">Loading constraints...</div>}
        {error && <div className="rounded border border-white/10 bg-black/40 p-3 text-sm text-zinc-200">{error}</div>}

        {!isLoading && !error && !localModel && (
          <div className="py-6 text-center text-sm text-slate-500">
            Choose a model to configure modality-specific defaults.
          </div>
        )}

        {!isLoading && !error && localModel && visibleFields.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleFields.map(({ key, field }) => (
              <ConstraintFieldInput
                key={key}
                fieldKey={key}
                field={field}
                value={(localSettings as Record<string, unknown>)[key]}
                onChange={(fieldKey, value) =>
                  setLocalSettings((current) => {
                    const next = { ...current, [fieldKey]: value };
                    return constraints ? validateSettings(next, constraints) : next;
                  })
                }
              />
            ))}
          </div>
        )}

        {!isLoading && !error && localModel && constraints && visibleFields.length === 0 && (
          <div className="py-6 text-center text-sm text-slate-500">No configurable settings for this model.</div>
        )}

        <div className="flex justify-between border-t border-white/10 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocalSettings(constraints ? buildDefaultSettings(constraints) : {})}
            disabled={!constraints}
          >
            Reset Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() =>
                onApply({
                  provider: localProvider || undefined,
                  model: localModel || undefined,
                  settings: Object.keys(localSettings).length > 0 ? localSettings : undefined,
                })
              }
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PipelineOutputSettingsModal;
