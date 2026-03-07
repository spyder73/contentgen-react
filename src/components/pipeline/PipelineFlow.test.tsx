import React from 'react';
import { render, screen } from '@testing-library/react';
import PipelineFlow from './PipelineFlow';
import { CheckpointConfig } from '../../api/structs';

const checkpoints: CheckpointConfig[] = [
  {
    id: 'split',
    name: 'Split',
    type: 'distributor',
    prompt_template_id: '',
    input_mapping: {
      source: 'initial_input',
    },
    requires_confirm: false,
    allow_regenerate: false,
    allow_attachments: false,
    distributor: {
      delimiter: 'newline',
      max_children: 3,
    },
  },
  {
    id: 'draft',
    name: 'Draft',
    type: 'prompt',
    prompt_template_id: '',
    input_mapping: {
      source: 'checkpoint:split',
    },
    requires_confirm: false,
    allow_regenerate: false,
    allow_attachments: false,
  },
  {
    id: 'join',
    name: 'Join',
    type: 'connector',
    prompt_template_id: '',
    input_mapping: {},
    requires_confirm: true,
    allow_regenerate: true,
    allow_attachments: false,
    connector: {
      strategy: 'first',
      source_checkpoint_id: 'split',
    },
  },
];

describe('PipelineFlow distributor and connector cues', () => {
  it('renders fan-out and fan-in indicators from checkpoint config', () => {
    render(
      <PipelineFlow
        checkpoints={checkpoints}
        promptTemplates={[]}
        selectedCheckpointId={null}
        onCheckpointClick={() => undefined}
        onCheckpointRemove={() => undefined}
        onReorder={() => undefined}
      />
    );

    expect(screen.getByText('Fan-out: delimiter newline | max 3 children')).toBeInTheDocument();
    expect(screen.getByText('Fan-in from split')).toBeInTheDocument();
    expect(screen.getAllByText('Connector')).toHaveLength(1);
    expect(screen.queryByText('source: split (fan-in)')).not.toBeInTheDocument();
    expect(screen.getByText('source: split (distributor output)')).toBeInTheDocument();
  });
});
