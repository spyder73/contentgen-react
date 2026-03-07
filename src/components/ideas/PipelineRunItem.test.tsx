import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PipelineRunItem from './PipelineRunItem';
import { PipelineRun, PipelineTemplate } from '../../api/structs';

const template: PipelineTemplate = {
  id: 'template-1',
  name: 'Template One',
  description: 'desc',
  checkpoints: [
    {
      id: 'split',
      name: 'Split',
      type: 'distributor',
      prompt_template_id: 'prompt-1',
      input_mapping: { source: 'initial_input' },
      requires_confirm: false,
      allow_regenerate: false,
      allow_attachments: false,
      distributor: {
        delimiter: 'newline',
        max_children: 2,
      },
    },
    {
      id: 'draft',
      name: 'Draft',
      type: 'prompt',
      prompt_template_id: 'prompt-2',
      input_mapping: { source: 'checkpoint:split' },
      requires_confirm: false,
      allow_regenerate: true,
      allow_attachments: false,
    },
    {
      id: 'join',
      name: 'Join',
      type: 'connector',
      prompt_template_id: '',
      input_mapping: {},
      requires_confirm: false,
      allow_regenerate: false,
      allow_attachments: false,
      connector: {
        strategy: 'first',
        source_checkpoint_id: 'split',
      },
    },
  ],
  version: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const run: PipelineRun = {
  id: 'run-1',
  pipeline_template_id: 'template-1',
  initial_input: 'Generate three ideas for a launch trailer',
  current_checkpoint: 2,
  status: 'running',
  auto_mode: true,
  results: [
    {
      checkpoint_id: 'split',
      status: 'completed',
      input: 'input',
      output: '{"outputs":[{"idea":"one"},{"idea":"two"}]}',
      regenerate_count: 0,
      child_pipeline_ids: ['child-1', 'child-2'],
    },
    {
      checkpoint_id: 'draft',
      status: 'completed',
      input: 'input',
      output: '{"idea":"draft"}',
      regenerate_count: 0,
    },
    {
      checkpoint_id: 'join',
      status: 'completed',
      input: 'input',
      output: '{"idea":"joined"}',
      regenerate_count: 0,
    },
  ],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('PipelineRunItem connector cues', () => {
  it('shows connector badge and fan-in only for connector checkpoints', () => {
    render(
      <PipelineRunItem
        run={run}
        template={template}
        onContinue={() => undefined}
        onRegenerate={(_checkpoint) => undefined}
        onInjectPrompt={async () => undefined}
        onAddAttachment={async () => undefined}
        onCancel={() => undefined}
        onRemove={() => undefined}
      />
    );

    fireEvent.click(screen.getByText('Expand'));

    expect(screen.getAllByText('Connector')).toHaveLength(1);

    fireEvent.click(screen.getByText('Draft'));
    expect(screen.queryByText('Fan-in from split')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Join'));
    expect(screen.getByText('Fan-in from split')).toBeInTheDocument();
  });

  it('renders attachment loading and empty states without layout breakage', () => {
    const templateWithAttachments: PipelineTemplate = {
      ...template,
      checkpoints: template.checkpoints.map((checkpoint, index) =>
        index === 1 ? { ...checkpoint, allow_attachments: true } : checkpoint
      ),
    };

    const runWithAttachmentStates: PipelineRun = {
      ...run,
      status: 'running',
      initial_attachments: undefined,
      results: run.results.map((result, index) =>
        index === 1 ? { ...result, attachments: [] } : result
      ),
    };

    render(
      <PipelineRunItem
        run={runWithAttachmentStates}
        template={templateWithAttachments}
        onContinue={() => undefined}
        onRegenerate={(_checkpoint) => undefined}
        onInjectPrompt={async () => undefined}
        onAddAttachment={async () => undefined}
        onCancel={() => undefined}
        onRemove={() => undefined}
      />
    );

    fireEvent.click(screen.getByText('Expand'));

    expect(screen.getByText('Initial Attachments')).toBeInTheDocument();
    expect(screen.getByText('Loading initial attachments...')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Draft'));
    expect(screen.getByText('Checkpoint 2 Attachments')).toBeInTheDocument();
    expect(screen.getByText('No attachments produced for this checkpoint.')).toBeInTheDocument();
  });

  it('renders attachment metadata from API payload', () => {
    const templateWithAttachments: PipelineTemplate = {
      ...template,
      checkpoints: template.checkpoints.map((checkpoint, index) =>
        index === 1 ? { ...checkpoint, allow_attachments: true } : checkpoint
      ),
    };

    const runWithAttachments: PipelineRun = {
      ...run,
      initial_attachments: [
        {
          id: 'asset-1',
          type: 'image',
          url: 'https://cdn.example.com/asset-1.png',
          mime_type: 'image/png',
          name: 'cover-frame',
          created_at: '2026-01-01T00:00:00Z',
          metadata: { width: 1024, height: 1024 },
        },
      ],
      results: run.results.map((result, index) =>
        index === 1
          ? {
              ...result,
              attachments: [
                {
                  id: 'asset-2',
                  type: 'image',
                  url: 'https://cdn.example.com/asset-2.png',
                  mime_type: 'image/png',
                  name: 'draft-preview',
                  created_at: '2026-01-01T00:00:00Z',
                  metadata: { source: 'asset_pool' },
                },
              ],
            }
          : result
      ),
    };

    render(
      <PipelineRunItem
        run={runWithAttachments}
        template={templateWithAttachments}
        onContinue={() => undefined}
        onRegenerate={(_checkpoint) => undefined}
        onInjectPrompt={async () => undefined}
        onAddAttachment={async () => undefined}
        onCancel={() => undefined}
        onRemove={() => undefined}
      />
    );

    fireEvent.click(screen.getByText('Expand'));
    expect(screen.getByText('cover-frame')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Draft'));
    expect(screen.getByText('draft-preview')).toBeInTheDocument();
    expect(screen.getByText('source: asset_pool')).toBeInTheDocument();
  });

  it('attaches selected reusable assets to a later checkpoint', async () => {
    const templateWithAttachments: PipelineTemplate = {
      ...template,
      checkpoints: template.checkpoints.map((checkpoint, index) =>
        index === 1 ? { ...checkpoint, allow_attachments: true } : checkpoint
      ),
    };

    const runWithReusableAssets: PipelineRun = {
      ...run,
      initial_attachments: [],
      results: run.results.map((result, index) =>
        index === 0
          ? {
              ...result,
              attachments: [
                {
                  id: 'asset-split',
                  type: 'image',
                  url: 'https://cdn.example.com/split-frame.png',
                  mime_type: 'image/png',
                  name: 'split-frame',
                  created_at: '2026-01-01T00:00:00Z',
                },
              ],
            }
          : index === 1
          ? {
              ...result,
              attachments: [],
            }
          : result
      ),
    };

    const onAddAttachment = jest.fn<Promise<void>, [number, any]>(async () => undefined);

    render(
      <PipelineRunItem
        run={runWithReusableAssets}
        template={templateWithAttachments}
        onContinue={() => undefined}
        onRegenerate={(_checkpoint) => undefined}
        onInjectPrompt={async () => undefined}
        onAddAttachment={onAddAttachment}
        onCancel={() => undefined}
        onRemove={() => undefined}
      />
    );

    fireEvent.click(screen.getByText('Expand'));
    fireEvent.click(screen.getByText('Draft'));

    const selector = screen.getByRole('combobox');
    fireEvent.change(selector, { target: { value: 'generated:asset-split' } });
    fireEvent.click(screen.getByRole('button', { name: 'Attach' }));

    await waitFor(() => {
      expect(onAddAttachment).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          type: 'image',
          url: 'https://cdn.example.com/split-frame.png',
          filename: 'split-frame',
        })
      );
    });
  });

  it('injects paused checkpoint guidance and requests regenerate', async () => {
    const pausedRun: PipelineRun = {
      ...run,
      status: 'paused',
      current_checkpoint: 1,
    };

    const onInjectPrompt = jest.fn<Promise<void>, [number, string, any]>(async () => undefined);

    render(
      <PipelineRunItem
        run={pausedRun}
        template={template}
        onContinue={() => undefined}
        onRegenerate={(_checkpoint) => undefined}
        onInjectPrompt={onInjectPrompt}
        onAddAttachment={async () => undefined}
        onCancel={() => undefined}
        onRemove={() => undefined}
      />
    );

    fireEvent.click(screen.getByText('Expand'));
    fireEvent.click(screen.getByText('Draft'));

    const guidanceField = screen.getByLabelText('Additive Prompt Guidance');
    fireEvent.change(guidanceField, { target: { value: 'Focus on product closeups and clean transitions.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Inject + Regenerate' }));

    await waitFor(() => {
      expect(onInjectPrompt).toHaveBeenCalledWith(1, 'Focus on product closeups and clean transitions.', {
        autoRegenerate: true,
        source: 'frontend_pause_checkpoint',
        mode: 'guidance_only',
      });
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Additive Prompt Guidance')).toHaveValue('');
    });
    expect(screen.queryByRole('button', { name: 'Clear Guidance' })).not.toBeInTheDocument();
  });

  it('shows actionable checkpoint inject errors', async () => {
    const pausedRun: PipelineRun = {
      ...run,
      status: 'paused',
      current_checkpoint: 1,
    };

    const onInjectPrompt = jest.fn<Promise<void>, [number, string, any]>(
      async () => Promise.reject({ response: { data: { error: 'Inject failed: template missing' } } })
    );

    render(
      <PipelineRunItem
        run={pausedRun}
        template={template}
        onContinue={() => undefined}
        onRegenerate={(_checkpoint) => undefined}
        onInjectPrompt={onInjectPrompt}
        onAddAttachment={async () => undefined}
        onCancel={() => undefined}
        onRemove={() => undefined}
      />
    );

    fireEvent.click(screen.getByText('Expand'));
    fireEvent.click(screen.getByText('Draft'));

    fireEvent.change(screen.getByLabelText('Additive Prompt Guidance'), {
      target: { value: 'Try a documentary tone.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Inject + Regenerate' }));

    await waitFor(() => {
      expect(screen.getByText('Inject failed: template missing')).toBeInTheDocument();
    });
  });

  it('injects guidance with prior output context mode when selected', async () => {
    const pausedRun: PipelineRun = {
      ...run,
      status: 'paused',
      current_checkpoint: 1,
    };

    const onInjectPrompt = jest.fn<Promise<void>, [number, string, any]>(async () => undefined);

    render(
      <PipelineRunItem
        run={pausedRun}
        template={template}
        onContinue={() => undefined}
        onRegenerate={(_checkpoint) => undefined}
        onInjectPrompt={onInjectPrompt}
        onAddAttachment={async () => undefined}
        onCancel={() => undefined}
        onRemove={() => undefined}
      />
    );

    fireEvent.click(screen.getByText('Expand'));
    fireEvent.click(screen.getByText('Draft'));
    fireEvent.click(screen.getByLabelText('Guidance + prior output context'));
    fireEvent.change(screen.getByLabelText('Additive Prompt Guidance'), {
      target: { value: 'Keep narrative continuity with prior frame pacing.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Inject + Regenerate' }));

    await waitFor(() => {
      expect(onInjectPrompt).toHaveBeenCalledWith(1, 'Keep narrative continuity with prior frame pacing.', {
        autoRegenerate: true,
        source: 'frontend_pause_checkpoint',
        mode: 'with_prior_output_context',
      });
    });

    expect(screen.getByText('Active mode: Guidance + prior output context')).toBeInTheDocument();
  });

  it('blocks continue when required checkpoint assets are missing', () => {
    const templateWithRequiredAssets: PipelineTemplate = {
      ...template,
      checkpoints: template.checkpoints.map((checkpoint, index) =>
        index === 1
          ? {
              ...checkpoint,
              allow_attachments: true,
              required_assets: [{ id: 'req-image', label: 'Input Image', kind: 'image', min_count: 1 }],
            }
          : checkpoint
      ),
    };

    const pausedRun: PipelineRun = {
      ...run,
      status: 'paused',
      current_checkpoint: 1,
      results: run.results.map((result, index) =>
        index === 1
          ? {
              ...result,
              status: 'completed',
              attachments: [],
            }
          : result
      ),
    };

    render(
      <PipelineRunItem
        run={pausedRun}
        template={templateWithRequiredAssets}
        onContinue={() => undefined}
        onRegenerate={(_checkpoint) => undefined}
        onInjectPrompt={async () => undefined}
        onAddAttachment={async () => undefined}
        onCancel={() => undefined}
        onRemove={() => undefined}
      />
    );

    fireEvent.click(screen.getByText('Expand'));
    fireEvent.click(screen.getByText('Draft'));

    expect(screen.getByText('Assets Missing')).toBeInTheDocument();
    expect(screen.getByText('Attach required assets before continuing.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });
});
