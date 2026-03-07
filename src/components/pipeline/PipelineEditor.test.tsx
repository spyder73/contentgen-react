import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PipelineEditor from './PipelineEditor';
import { CheckpointConfig, PipelineTemplate } from '../../api/structs';

const buildPipeline = (checkpoints: CheckpointConfig[] = []): PipelineTemplate => ({
  id: 'pipe-1',
  name: 'Test Pipeline',
  description: 'desc',
  checkpoints,
  version: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
});

describe('PipelineEditor checkpoint UX', () => {
  it('adds a checkpoint through the add-checkpoint modal', async () => {
    render(
      <PipelineEditor
        pipeline={buildPipeline()}
        promptTemplates={[]}
        onSave={async () => undefined}
        onEditPrompt={() => undefined}
        onCheckpointAdd={() => undefined}
        onCheckpointRemove={() => undefined}
        onCheckpointUpdate={() => undefined}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Add Checkpoint' }));

    fireEvent.change(screen.getByPlaceholderText('Checkpoint ID (e.g., first-draft)'), {
      target: { value: 'first-step' },
    });
    fireEvent.change(screen.getByPlaceholderText('Checkpoint Name'), {
      target: { value: 'First Step' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Checkpoint' }));

    expect(screen.getByText('1 checkpoints')).toBeInTheDocument();
    expect(screen.getByText('First Step')).toBeInTheDocument();
  });

  it('shows an inline error for duplicate checkpoint IDs', async () => {
    render(
      <PipelineEditor
        pipeline={buildPipeline([
          {
            id: 'first-step',
            name: 'First Step',
            prompt_template_id: '',
            input_mapping: {},
            requires_confirm: true,
            allow_regenerate: true,
            allow_attachments: false,
            provider: '',
            model: '',
          },
        ])}
        promptTemplates={[]}
        onSave={async () => undefined}
        onEditPrompt={() => undefined}
        onCheckpointAdd={() => undefined}
        onCheckpointRemove={() => undefined}
        onCheckpointUpdate={() => undefined}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Add Checkpoint' }));
    fireEvent.change(screen.getByPlaceholderText('Checkpoint ID (e.g., first-draft)'), {
      target: { value: 'first-step' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Checkpoint' }));

    expect(screen.getByText('Checkpoint ID "first-step" already exists.')).toBeInTheDocument();
  });
});
