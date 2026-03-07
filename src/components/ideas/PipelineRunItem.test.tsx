import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
});
