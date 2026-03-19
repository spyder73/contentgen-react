import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { CheckpointConfig } from '../../../api/structs';
import PipelineExtendedView from '../extended/PipelineExtendedView';

const checkpoints: CheckpointConfig[] = [
  {
    id: 'prompt-step',
    name: 'Prompt Step',
    type: 'prompt',
    prompt_template_id: '',
    input_mapping: { subject: 'initial_input' },
    requires_confirm: false,
    allow_regenerate: true,
    allow_attachments: false,
    promptGate: { provider: 'openrouter', model: 'x-ai/grok-4-fast' },
  },
  {
    id: 'generator-step',
    name: 'Generator Step',
    type: 'generator',
    prompt_template_id: '',
    input_mapping: { prompt: 'checkpoint:prompt-step', refs: 'attachments:prompt-step' },
    requires_confirm: false,
    allow_regenerate: true,
    allow_attachments: true,
    generator: {
      media_type: 'image',
      role: 'reference_frame',
      mode: 'image_to_image',
      provider: 'runware',
      model: 'runware:400@1',
    },
  },
];

describe('PipelineExtendedView', () => {
  it('renders mapping labels and selects checkpoint from the settings icon', () => {
    const onSelectCheckpoint = jest.fn();

    render(
      <PipelineExtendedView
        checkpoints={checkpoints}
        selectedCheckpointId={null}
        onSelectCheckpoint={onSelectCheckpoint}
      />
    );

    expect(screen.getByText('Artifact Lanes')).toBeInTheDocument();
    expect(screen.getAllByText('refs')).toHaveLength(1);

    fireEvent.click(screen.getByLabelText('Open Generator Step settings'));

    expect(onSelectCheckpoint).toHaveBeenCalledWith('generator-step');
    expect(screen.getByText(/Mappings: prompt -> checkpoint:prompt-step/i)).toBeInTheDocument();
    expect(screen.getByText(/refs -> attachments:prompt-step/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Open Prompt Step settings'));

    expect(screen.getByText(/subject -> initial_input/i)).toBeInTheDocument();
  });

  it('supports zoom controls', () => {
    render(
      <PipelineExtendedView
        checkpoints={checkpoints}
        selectedCheckpointId={null}
        onSelectCheckpoint={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /reset zoom/i })).toHaveTextContent('100%');

    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    expect(screen.getByRole('button', { name: /reset zoom/i })).toHaveTextContent('115%');

    fireEvent.click(screen.getByRole('button', { name: /zoom out/i }));
    expect(screen.getByRole('button', { name: /reset zoom/i })).toHaveTextContent('100%');
  });

  it('toggles media buses on and off', () => {
    render(
      <PipelineExtendedView
        checkpoints={checkpoints}
        selectedCheckpointId={null}
        onSelectCheckpoint={jest.fn()}
      />
    );

    expect(screen.getAllByText('refs')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /toggle media/i }));
    expect(screen.queryAllByText('refs')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: /toggle media/i }));
    expect(screen.getAllByText('refs')).toHaveLength(1);
  });
});
