import React, { useState, useEffect, useMemo } from 'react';
import ModelsAPI from '../../api/models';
import {
  AUDIO_PROVIDERS,
  CHAT_PROVIDERS,
  IMAGE_PROVIDERS,
  ProviderDefinition,
  Provider,
  VideoProvider,
  VIDEO_PROVIDERS,
  providerRequiresModel,
} from '../../api/structs/providers';
import { AIModel, formatPrice } from '../../api/structs/model';
import { Select, Dropdown } from '../ui';


type SelectorModality = 'chat' | 'image' | 'video' | 'audio';

interface CheckpointProviderSelectorProps {
  provider: string;
  model: string;
  modality?: SelectorModality;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  allowInherit?: boolean;
  inheritLabel?: string;
  requireSeedImageSupport?: boolean;
  allowManualModelInput?: boolean;
  providerAriaLabel?: string;
  modelAriaLabel?: string;
  onValidationChange?: (message: string) => void;
  onSelectedPrice?: (price: string) => void;
}

const PROVIDER_OPTIONS_BY_MODALITY: Record<SelectorModality, ProviderDefinition[]> = {
  chat: CHAT_PROVIDERS,
  image: IMAGE_PROVIDERS,
  video: VIDEO_PROVIDERS,
  audio: AUDIO_PROVIDERS,
};

const supportsReferenceInput = (constraints: Record<string, unknown> | undefined): boolean =>
  Boolean(
    constraints &&
      (constraints.supports_seed_image === true || constraints.supports_reference_images === true)
  );

const CheckpointProviderSelector: React.FC<CheckpointProviderSelectorProps> = ({
  provider,
  model,
  modality = 'chat',
  onProviderChange,
  onModelChange,
  allowInherit = true,
  inheritLabel = 'Inherit from run',
  requireSeedImageSupport = false,
  allowManualModelInput = false,
  providerAriaLabel,
  modelAriaLabel,
  onValidationChange,
  onSelectedPrice,
}) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [providerValidationMessage, setProviderValidationMessage] = useState('');

  const providerOptionsForModality = PROVIDER_OPTIONS_BY_MODALITY[modality];
  const inheritOption: ProviderDefinition = useMemo(
    () => ({ value: '', label: inheritLabel }),
    [inheritLabel]
  );
  const providerOptionsBase = allowInherit
    ? [inheritOption, ...providerOptionsForModality]
    : providerOptionsForModality;
  const knownProviders = useMemo(
    () => new Set(providerOptionsForModality.map((item) => item.value)),
    [providerOptionsForModality]
  );

  const providerOptions = provider && !knownProviders.has(provider)
    ? [...providerOptionsBase, { value: provider, label: `${provider} (Unsupported)` }]
    : providerOptionsBase;

  useEffect(() => {
    if (!provider) {
      setModels([]);
      setProviderValidationMessage('');
      return;
    }

    if (!knownProviders.has(provider)) {
      setModels([]);
      setProviderValidationMessage(
        `Provider "${provider}" is not available for this checkpoint type. Choose a listed provider or clear to inherit pipeline defaults.`
      );
      return;
    }

    if (!providerRequiresModel(provider as Provider)) {
      setModels([]);
      setProviderValidationMessage('');
      return;
    }

    const fetchModels = async () => {
      setLoading(true);
      try {
        let fetched: AIModel[] = [];
        if (modality === 'chat') {
          fetched = await ModelsAPI.getChatModels();
        } else if (modality === 'image') {
          fetched = await ModelsAPI.getImageModels(provider);
        } else if (modality === 'video') {
          fetched = await ModelsAPI.getVideoModels(provider as VideoProvider);
        } else if (modality === 'audio') {
          fetched = await ModelsAPI.getAudioModels(provider);
        }

        if (modality === 'image' && requireSeedImageSupport) {
          const compatibility = await Promise.all(
            fetched.map(async (candidate) => {
              try {
                const constraints = await ModelsAPI.getModelConstraints(candidate.id, 'image');
                return { model: candidate, compatible: supportsReferenceInput(constraints.capabilities) };
              } catch {
                return { model: candidate, compatible: false };
              }
            })
          );
          const compatibleModels = compatibility
            .filter((entry) => entry.compatible)
            .map((entry) => entry.model);
          setModels(compatibleModels);
          setProviderValidationMessage(
            compatibleModels.length === 0
              ? `No ${provider} image models with seed/reference support are available. Choose another provider or clear to inherit pipeline defaults.`
              : ''
          );
        } else {
          setModels(fetched);
          setProviderValidationMessage('');
        }
      } catch (error) {
        console.error('Failed to fetch checkpoint models:', error);
        setModels([]);
        setProviderValidationMessage('Failed to fetch models from registry.');
      } finally {
        setLoading(false);
      }
    };

    void fetchModels();
  }, [provider, modality, knownProviders, requireSeedImageSupport]);

  useEffect(() => {
    if (!provider || !knownProviders.has(provider) || !providerRequiresModel(provider as Provider)) {
      return;
    }

    if (!model && models.length > 0) {
      onModelChange(models[0]?.id || '');
    }
  }, [provider, model, models, onModelChange, knownProviders]);

  const shouldUseManualModelInput =
    allowManualModelInput &&
    Boolean(provider) &&
    knownProviders.has(provider) &&
    !providerRequiresModel(provider as Provider);

  const modelIsUnsupported =
    Boolean(provider) &&
    knownProviders.has(provider) &&
    providerRequiresModel(provider as Provider) &&
    Boolean(model) &&
    !loading &&
    !models.some((candidate) => candidate.id === model);

  const validationMessage = modelIsUnsupported
    ? `Model "${model}" is unavailable for provider "${provider}". Select a listed model or clear provider/model to inherit pipeline defaults.`
    : providerValidationMessage;

  useEffect(() => {
    onValidationChange?.(validationMessage);
  }, [onValidationChange, validationMessage]);

  useEffect(() => {
    if (!onSelectedPrice) return;
    const selectedModel = models.find((m) => m.id === model);
    onSelectedPrice(selectedModel ? formatPrice(selectedModel) : '');
  }, [model, models, onSelectedPrice]);

  const dropdownOptions = models.map((m) => ({
    value: m.id,
    label: m.name,
    sublabel: m.id,
    rightLabel: formatPrice(m),
  }));
  const optionsWithUnsupported = modelIsUnsupported
    ? [
        {
          value: model,
          label: `${model} (Unsupported)`,
          sublabel: model,
          rightLabel: '',
        },
        ...dropdownOptions,
      ]
    : dropdownOptions;

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-1 gap-2 min-w-0 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]">
        <Select
          options={providerOptions}
          value={provider}
          aria-label={providerAriaLabel}
          onChange={(e) => {
            onProviderChange(e.target.value);
          }}
          selectSize="sm"
          className="w-full min-w-0"
        />

        {provider && knownProviders.has(provider) && providerRequiresModel(provider as Provider) && (
          <Dropdown
            options={optionsWithUnsupported}
            value={model}
            onChange={onModelChange}
            placeholder="Select model"
            searchable
            loading={loading}
            className="w-full min-w-0"
            buttonClassName="w-full min-w-0"
            ariaLabel={modelAriaLabel}
          />
        )}

        {shouldUseManualModelInput && (
          <input
            type="text"
            value={model}
            onChange={(event) => onModelChange(event.target.value)}
            aria-label={modelAriaLabel}
            className="input input-sm w-full min-w-0"
            placeholder="Enter model id"
          />
        )}

        {provider === '' && (
          <span className="text-xs text-gray-500 italic sm:col-span-2">
            Uses pipeline defaults (then run/app fallback)
          </span>
        )}
      </div>

      {validationMessage && (
        <p className="text-[11px] text-amber-300">{validationMessage}</p>
      )}
    </div>
  );
};

export default CheckpointProviderSelector;
