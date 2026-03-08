import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

  it('edits and serializes chain sub-checkpoints with ordering and role labels', async () => {
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
      target: { value: 'chain-step' },
    });
    fireEvent.change(screen.getByPlaceholderText('Checkpoint Name'), {
      target: { value: 'Chain Step' },
    });
    fireEvent.change(screen.getByDisplayValue('Prompt (single output)'), {
      target: { value: 'chain' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Checkpoint' }));

    const chainEditor = await screen.findByTestId('chain-sub-checkpoint-editor');
    const roleInputs = within(chainEditor).getAllByPlaceholderText(/output_/i);
    fireEvent.change(roleInputs[0], { target: { value: 'hook_frame' } });
    fireEvent.change(roleInputs[1], { target: { value: 'cta_frame' } });

    const textareas = within(chainEditor).getAllByPlaceholderText(
      'Describe this sub-checkpoint prompt/config...'
    );
    fireEvent.change(textareas[0], {
      target: { value: 'Create hook scene with strong opening frame.' },
    });

    fireEvent.click(within(chainEditor).getByRole('button', { name: '+ Add Sub-Checkpoint' }));
    const downButtons = within(chainEditor).getAllByRole('button', { name: 'Down' });
    fireEvent.click(downButtons[0]);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    const savedPipeline = onSave.mock.calls[0][0];
    const savedChain = savedPipeline.checkpoints[0].chain;
    const rawSubCheckpoints = savedChain?.sub_checkpoints;
    const savedSubCheckpoints = Array.isArray(rawSubCheckpoints)
      ? rawSubCheckpoints
      : [];
    expect(savedChain?.count).toBe(3);
    expect(savedSubCheckpoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          output_role: 'hook_frame',
        }),
        expect.objectContaining({
          output_role: 'cta_frame',
        }),
      ])
    );
    expect(savedSubCheckpoints[0]).toEqual(
      expect.objectContaining({
        order: 1,
      })
    );
  });
});
