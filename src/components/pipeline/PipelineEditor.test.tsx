import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('adds distributor checkpoints with default fan-out config', async () => {
    const onSave = jest.fn<Promise<void>, [PipelineTemplate]>(async () => undefined);

    render(
      <PipelineEditor
        pipeline={buildPipeline()}
        promptTemplates={[]}
        onSave={onSave}
        onEditPrompt={() => undefined}
        onCheckpointAdd={() => undefined}
        onCheckpointRemove={() => undefined}
        onCheckpointUpdate={() => undefined}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Add Checkpoint' }));
    fireEvent.change(screen.getByPlaceholderText('Checkpoint ID (e.g., first-draft)'), {
      target: { value: 'split-input' },
    });
    fireEvent.change(screen.getByPlaceholderText('Checkpoint Name'), {
      target: { value: 'Split Input' },
    });
    fireEvent.change(screen.getByDisplayValue('Prompt (single output)'), {
      target: { value: 'distributor' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Checkpoint' }));

    expect(screen.getByText('Distributor')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const savedPipeline = onSave.mock.calls[0][0];
    expect(savedPipeline.checkpoints[0]).toMatchObject({
      id: 'split-input',
      type: 'distributor',
      distributor: {
        delimiter: 'newline',
        max_children: 8,
      },
    });
  });

  it('adds connector checkpoints with default strategy config', async () => {
    const onSave = jest.fn<Promise<void>, [PipelineTemplate]>(async () => undefined);

    render(
      <PipelineEditor
        pipeline={buildPipeline()}
        promptTemplates={[]}
        onSave={onSave}
        onEditPrompt={() => undefined}
        onCheckpointAdd={() => undefined}
        onCheckpointRemove={() => undefined}
        onCheckpointUpdate={() => undefined}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Add Checkpoint' }));
    fireEvent.change(screen.getByPlaceholderText('Checkpoint ID (e.g., first-draft)'), {
      target: { value: 'join-results' },
    });
    fireEvent.change(screen.getByPlaceholderText('Checkpoint Name'), {
      target: { value: 'Join Results' },
    });
    fireEvent.change(screen.getByDisplayValue('Prompt (single output)'), {
      target: { value: 'connector' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Checkpoint' }));

    expect(screen.getByText('Connector')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const savedPipeline = onSave.mock.calls[0][0];
    expect(savedPipeline.checkpoints[0]).toMatchObject({
      id: 'join-results',
      type: 'connector',
      connector: {
        strategy: 'first',
      },
    });
  });
});
