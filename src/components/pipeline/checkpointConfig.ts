import { CheckpointConfig, CheckpointType } from '../../api/structs';
import {
  DEFAULT_CONNECTOR_CONFIG,
  DEFAULT_DISTRIBUTOR_CONFIG,
  DEFAULT_GENERATOR_CONFIG,
} from './utils';

const buildBaseCheckpoint = (
  checkpoint: CheckpointConfig
): CheckpointConfig => ({
  ...checkpoint,
  type: checkpoint.type || 'prompt',
  input_mapping: checkpoint.input_mapping || {},
  requires_confirm: Boolean(checkpoint.requires_confirm),
  allow_regenerate: Boolean(checkpoint.allow_regenerate),
  allow_attachments: Boolean(checkpoint.allow_attachments),
});

export const createCheckpointConfig = (
  id: string,
  name: string,
  type: CheckpointType,
  previousDistributorId?: string
): CheckpointConfig =>
  applyCheckpointType(
    {
      id,
      name,
      type,
      prompt_template_id: '',
      input_mapping: {},
      requires_confirm: true,
      allow_regenerate: true,
      allow_attachments: false,
    },
    type,
    previousDistributorId
  );

export const applyCheckpointType = (
  checkpoint: CheckpointConfig,
  type: CheckpointType,
  previousDistributorId?: string
): CheckpointConfig => {
  const next = buildBaseCheckpoint({
    ...checkpoint,
    type,
    promptGate: undefined,
    distributor: undefined,
    connector: undefined,
    generator: undefined,
  });

  if (type === 'prompt') {
    return next;
  }

  if (type === 'distributor') {
    return {
      ...next,
      distributor: checkpoint.distributor || { ...DEFAULT_DISTRIBUTOR_CONFIG },
    };
  }

  if (type === 'connector') {
    return {
      ...next,
      connector: {
        ...DEFAULT_CONNECTOR_CONFIG,
        ...checkpoint.connector,
        strategy: 'collect_all',
        source_checkpoint_id:
          checkpoint.connector?.source_checkpoint_id || previousDistributorId || undefined,
      },
    };
  }

  return {
    ...next,
    generator: {
      ...DEFAULT_GENERATOR_CONFIG,
      ...checkpoint.generator,
    },
  };
};

export const getCheckpointSelector = (
  checkpoint: CheckpointConfig
): { provider: string; model: string } => {
  const type = checkpoint.type || 'prompt';

  if (type === 'prompt') {
    return {
      provider: checkpoint.promptGate?.provider || '',
      model: checkpoint.promptGate?.model || '',
    };
  }

  if (type === 'distributor') {
    return {
      provider: checkpoint.distributor?.provider || '',
      model: checkpoint.distributor?.model || '',
    };
  }

  if (type === 'generator') {
    return {
      provider: checkpoint.generator?.provider || '',
      model: checkpoint.generator?.model || '',
    };
  }

  return { provider: '', model: '' };
};

export const updateCheckpointSelector = (
  checkpoint: CheckpointConfig,
  field: 'provider' | 'model',
  value: string | undefined
): CheckpointConfig => {
  const type = checkpoint.type || 'prompt';
  const nextValue = value || undefined;

  if (type === 'prompt') {
    const promptGate = {
      ...checkpoint.promptGate,
      [field]: nextValue,
    };
    if (field === 'provider') {
      promptGate.model = undefined;
    }
    return { ...checkpoint, promptGate };
  }

  if (type === 'distributor') {
    const distributor = {
      ...DEFAULT_DISTRIBUTOR_CONFIG,
      ...checkpoint.distributor,
      [field]: nextValue,
    };
    if (field === 'provider') {
      distributor.model = '';
    }
    return { ...checkpoint, distributor };
  }

  if (type === 'generator') {
    const generator = {
      ...DEFAULT_GENERATOR_CONFIG,
      ...checkpoint.generator,
      [field]: nextValue,
    };
    if (field === 'provider') {
      generator.model = '';
    }
    return { ...checkpoint, generator };
  }

  return checkpoint;
};
