import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PipelineRunItem from '../PipelineRunItem';
import { PipelineRun, PipelineTemplate } from '../../../api/structs';

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
    },
    {
      id: 'join',
      name: 'Join',
      type: 'connector',
      prompt_template_id: '',
      input_mapping: {},
      requires_confirm: false,
      allow_regenerate: false,
      connector: {
        strategy: 'collect_all',
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

  it('renders structured connector scene references when output includes scene_references', () => {
    const runWithStructuredConnector: PipelineRun = {
      ...run,
      results: run.results.map((result, index) =>
        index === 2
          ? {
              ...result,
              output: JSON.stringify({
                scene_references: [
                  {
                    scene_id: 'scene-2',
                    order: 2,
                    required_reference: true,
                    reference_name: 'Bridge Frame',
                    reference_media_id: 'media-2',
                    reference_url: 'https://cdn.example.com/scene-2.png',
                  },
                  {
                    scene_id: 'scene-1',
                    order: 1,
                    required_reference: true,
                    reference_name: 'Hero Frame',
                    reference_media_id: 'media-1',
                    reference_url: 'https://cdn.example.com/scene-1.png',
                  },
                ],
              }),
            }
          : result
      ),
    };

    render(
      <PipelineRunItem
        run={runWithStructuredConnector}
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
    fireEvent.click(screen.getByText('Join'));

    expect(screen.getByText('Scene References')).toBeInTheDocument();
    expect(screen.getByText(/Scene 1:/i)).toBeInTheDocument();
    expect(screen.getByText(/Hero Frame/i)).toBeInTheDocument();
    expect(screen.getByText(/Scene 2:/i)).toBeInTheDocument();
    expect(screen.queryByText(/"scene_references"/i)).not.toBeInTheDocument();
  });

  it('falls back to raw connector output when scene reference parsing fails', () => {
    const runWithMalformedConnector: PipelineRun = {
      ...run,
      results: run.results.map((result, index) =>
        index === 2
          ? {
              ...result,
              output: '{"scene_references":',
            }
          : result
      ),
    };

    render(
      <PipelineRunItem
        run={runWithMalformedConnector}
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
    fireEvent.click(screen.getByText('Join'));

    expect(screen.queryByText('Scene References')).not.toBeInTheDocument();
    expect(screen.getByText('{"scene_references":')).toBeInTheDocument();
  });

  it('renders attachment loading and empty states without layout breakage', () => {
    const templateWithAttachments: PipelineTemplate = {
      ...template,
      checkpoints: template.checkpoints.map((checkpoint, index) =>
        index === 1 ? { ...checkpoint } : checkpoint
      ),
    };

    const runWithAttachmentStates: PipelineRun = {
      ...run,
      status: 'running',
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
    expect(screen.getByText('No initial attachments.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Draft'));
    expect(screen.getByText('Checkpoint 2 Attachments')).toBeInTheDocument();
    expect(screen.getByText('No attachments produced for this checkpoint.')).toBeInTheDocument();
  });

  it('renders attachment metadata from API payload', () => {
    const templateWithAttachments: PipelineTemplate = {
      ...template,
      checkpoints: template.checkpoints.map((checkpoint, index) =>
        index === 1 ? { ...checkpoint } : checkpoint
      ),
    };

    const runWithAttachments: PipelineRun = {
      ...run,
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

  it('shows checkpoint attachment previews even when attachment editing is disabled', () => {
    const runWithGeneratorAttachments: PipelineRun = {
      ...run,
      results: run.results.map((result, index) =>
        index === 1
          ? {
              ...result,
              attachments: [
                {
                  id: 'asset-3',
                  type: 'image',
                  url: 'https://cdn.example.com/generated-preview.png',
                  mime_type: 'image/png',
                  name: 'generated-preview',
                  created_at: '2026-01-01T00:00:00Z',
                },
              ],
            }
          : result
      ),
    };

    render(
      <PipelineRunItem
        run={runWithGeneratorAttachments}
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
    fireEvent.click(screen.getByText('Draft'));

    expect(screen.getByText('Checkpoint 2 Attachments')).toBeInTheDocument();
    expect(screen.getByText('generated-preview')).toBeInTheDocument();
  });

  it('attaches selected reusable assets to a later checkpoint', async () => {
    const templateWithAttachments: PipelineTemplate = {
      ...template,
      checkpoints: template.checkpoints.map((checkpoint, index) =>
        index === 1 ? { ...checkpoint } : checkpoint
      ),
    };

    const runWithReusableAssets: PipelineRun = {
      ...run,
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

  it('shows attach-and-continue controls for awaiting_asset checkpoints even when attachments are not explicitly allowed', () => {
    const templateWithRequiredAssets: PipelineTemplate = {
      ...template,
      checkpoints: template.checkpoints.map((checkpoint, index) =>
        index === 1
          ? {
              ...checkpoint,
              required_assets: [{ key: 'req-image', type: 'image', source: 'user' }],
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
              status: 'awaiting_asset',
              attachments: [],
              error: 'Attach an approved image asset before retrying this checkpoint.',
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
    expect(screen.getByText('Awaiting Asset')).toBeInTheDocument();
    expect(screen.getAllByText('Attach an approved image asset before retrying this checkpoint.').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Attach' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('shows required-reference prompt on backend block and recovers after attach', async () => {
    const templateWithAttachments: PipelineTemplate = {
      ...template,
      checkpoints: template.checkpoints.map((checkpoint, index) =>
        index === 1 ? { ...checkpoint } : checkpoint
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
              attachments: [],
            }
          : result
      ),
    };

    const onContinue = jest
      .fn<Promise<void>, []>()
      .mockRejectedValueOnce({
        response: {
          data: {
            message: 'Missing required references',
            missing_required_references: [
              { scene_id: 'scene-1', order: 1, message: 'Attach a reference image before continuing.' },
            ],
          },
        },
      })
      .mockResolvedValueOnce(undefined);
    const onAddAttachment = jest.fn<Promise<void>, [number, any]>(async () => undefined);

    render(
      <PipelineRunItem
        run={pausedRun}
        template={templateWithAttachments}
        onContinue={onContinue}
        onRegenerate={async (_checkpoint) => undefined}
        onInjectPrompt={async () => undefined}
        onAddAttachment={onAddAttachment}
        onCancel={() => undefined}
        onRemove={() => undefined}
      />
    );

    fireEvent.click(screen.getByText('Expand'));
    fireEvent.click(screen.getByText('Draft'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByText('Reference Required')).toBeInTheDocument();
      expect(screen.getByText('Attach a reference image before continuing.')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'media:seed-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Attach' }));

    await waitFor(() => {
      expect(onAddAttachment).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          media_id: 'seed-1',
          type: 'image',
        })
      );
    });
    expect(onContinue).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.queryByText('Reference Required')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledTimes(2);
    });
  });

  it('renders mixed-provider pricing summaries and estimated markers', () => {
    const runWithCosts: PipelineRun = {
      ...run,
      cost_summary: {
        estimated: true,
        currency: 'USD',
        providers: {
          runware: {
            total_cost: 0.12,
            per_clip_cost: 0.06,
            clip_count: 2,
          },
          openrouter: {
            total_cost: 0.03,
            per_clip_cost: 0.015,
            clip_count: 2,
            estimated: true,
          },
        },
      },
    };

    render(
      <PipelineRunItem
        run={runWithCosts}
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

    expect(screen.getByText('Pricing Summary')).toBeInTheDocument();
    expect(screen.getByText(/Runware: \$0.12/i)).toBeInTheDocument();
    expect(screen.getByText(/OpenRouter: \$0.03/i)).toBeInTheDocument();
    expect(screen.getByText(/Runware: \$0.06/i)).toBeInTheDocument();
    expect(screen.getByText(/OpenRouter: \$0.015/i)).toBeInTheDocument();
    expect(screen.getByText(/Estimated values/i)).toBeInTheDocument();
  });

  it('shows fallback total cost display from cost.total_usd', () => {
    const runWithSimpleCost: PipelineRun = {
      ...run,
      cost: {
        total_usd: 0.42,
      },
    };

    render(
      <PipelineRunItem
        run={runWithSimpleCost}
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

    expect(screen.getByText('Pricing Summary')).toBeInTheDocument();
    expect(screen.getByText(/Total: \$0.42/i)).toBeInTheDocument();
  });

  it('shows app-default model context when run defaults are absent', () => {
    const runWithoutDefaults: PipelineRun = {
      ...run,
      provider: '',
      model: '',
    };

    render(
      <PipelineRunItem
        run={runWithoutDefaults}
        template={template}
        onContinue={() => undefined}
        onRegenerate={(_checkpoint) => undefined}
        onInjectPrompt={async () => undefined}
        onAddAttachment={async () => undefined}
        onCancel={() => undefined}
        onRemove={() => undefined}
      />
    );

    expect(
      screen.getByText(/Effective Text Model: not set \(app defaults\)/i)
    ).toBeInTheDocument();
  });
});
