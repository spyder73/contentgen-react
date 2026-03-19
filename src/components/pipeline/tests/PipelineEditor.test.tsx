import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ModelsAPI from '../../../api/models';
import { CheckpointConfig, PipelineTemplate } from '../../../api/structs';
import PipelineEditor from '../PipelineEditor';

jest.mock('../../../api/models');

const mockedModelsApi = ModelsAPI as jest.Mocked<typeof ModelsAPI>;

const buildPipeline = (checkpoints: CheckpointConfig[] = []): PipelineTemplate => ({
  id: 'pipe-1',
  name: 'Test Pipeline',
  description: 'desc',
  checkpoints,
  output_format: {},
  version: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
});

const renderEditor = (
  pipeline: PipelineTemplate,
  onSave = jest.fn<Promise<void>, [PipelineTemplate]>(async () => undefined)
) => {
  render(
    <PipelineEditor
      pipeline={pipeline}
      promptTemplates={[]}
      onSave={onSave}
      onEditPrompt={() => undefined}
    />
  );
  return onSave;
};

describe('PipelineEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedModelsApi.getChatModels.mockResolvedValue([]);
    mockedModelsApi.getImageModels.mockResolvedValue([]);
    mockedModelsApi.getVideoModels.mockResolvedValue([]);
    mockedModelsApi.getModelConstraints.mockResolvedValue({
      capabilities: { supports_seed_image: true },
    } as any);
  });

  it('renders Final Clip Generation Settings when no checkpoint is selected', () => {
    renderEditor(buildPipeline());

    expect(screen.getByText('Final Clip Generation Settings')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Template-level defaults stamped into final clip prompt rows only. Generator checkpoints use their own checkpoint config.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Select a checkpoint to edit its nested config/i)
    ).toBeInTheDocument();
    expect(screen.queryByText('Aspect Ratio')).not.toBeInTheDocument();
    expect(screen.queryByText('Long Edge')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Image Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Video Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Audio Settings' })).toBeInTheDocument();
  });

  it('keeps Final Clip Generation Settings visible while a checkpoint is selected', () => {
    renderEditor(
      buildPipeline([
        {
          id: 'prompt-step',
          name: 'Prompt Step',
          type: 'prompt',
          prompt_template_id: '',
          input_mapping: {},
          requires_confirm: false,
          allow_regenerate: true,
          allow_attachments: false,
        },
      ])
    );

    fireEvent.click(screen.getByText('Prompt Step'));

    expect(screen.getByText('Final Clip Generation Settings')).toBeInTheDocument();
    expect(screen.getByText('Checkpoint Details')).toBeInTheDocument();
  });

  it('opens image defaults selector inside the Image Settings modal', async () => {
    renderEditor(buildPipeline());

    expect(screen.queryByLabelText('Image default provider')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Image Settings' }));

    expect(await screen.findByLabelText('Image default provider')).toBeInTheDocument();
  });

  it('opens the extended pipeline view modal from the header button', () => {
    renderEditor(buildPipeline());

    fireEvent.click(screen.getByRole('button', { name: 'Open extended view' }));

    expect(screen.getByText('Extended Pipeline View')).toBeInTheDocument();
  });

  it('adds connector checkpoints with collect_all strategy by default', async () => {
    const onSave = renderEditor(buildPipeline());

    fireEvent.click(screen.getByRole('button', { name: '+ Add Checkpoint' }));
    fireEvent.change(screen.getByPlaceholderText('Checkpoint ID (e.g., first-draft)'), {
      target: { value: 'join-results' },
    });
    fireEvent.change(screen.getByPlaceholderText('Checkpoint Name'), {
      target: { value: 'Join Results' },
    });
    fireEvent.change(screen.getByDisplayValue('Prompt'), {
      target: { value: 'connector' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Checkpoint' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].checkpoints[0]).toMatchObject({
      type: 'connector',
      connector: {
        strategy: 'collect_all',
      },
    });
  });

  it('persists generator mode inside generator config', async () => {
    const onSave = renderEditor(buildPipeline());

    fireEvent.click(screen.getByRole('button', { name: '+ Add Checkpoint' }));
    fireEvent.change(screen.getByPlaceholderText('Checkpoint ID (e.g., first-draft)'), {
      target: { value: 'generator-step' },
    });
    fireEvent.change(screen.getByPlaceholderText('Checkpoint Name'), {
      target: { value: 'Generator Step' },
    });
    fireEvent.change(screen.getByDisplayValue('Prompt'), {
      target: { value: 'generator' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Checkpoint' }));

    fireEvent.change(screen.getByDisplayValue('text_to_image'), {
      target: { value: 'image_to_image' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].checkpoints[0]).toMatchObject({
      type: 'generator',
      generator: {
        mode: 'image_to_image',
      },
    });
  });

  it('clears generator output_spec when the media type changes', async () => {
    const onSave = renderEditor(
      buildPipeline([
        {
          id: 'generator-step',
          name: 'Generator Step',
          type: 'generator',
          prompt_template_id: '',
          input_mapping: {},
          requires_confirm: false,
          allow_regenerate: true,
          allow_attachments: false,
          output_spec: {
            width: 768,
            height: 1344,
            steps: 30,
            cfg_scale: 7.5,
          },
          generator: {
            media_type: 'image',
            mode: 'text_to_image',
            provider: 'runware',
            model: 'runware:400@1',
            role: 'seed_image',
          },
        },
      ])
    );

    fireEvent.click(screen.getByText('Generator Step'));
    fireEvent.change(screen.getByDisplayValue('Image'), {
      target: { value: 'video' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].checkpoints[0].output_spec).toBeUndefined();
  });

  it('writes prompt selector changes to promptGate instead of root-level fields', async () => {
    const onSave = renderEditor(
      buildPipeline([
        {
          id: 'prompt-step',
          name: 'Prompt Step',
          type: 'prompt',
          prompt_template_id: '',
          input_mapping: {},
          requires_confirm: false,
          allow_regenerate: true,
          allow_attachments: false,
        },
      ])
    );

    fireEvent.click(screen.getByText('Prompt Step'));
    fireEvent.change(screen.getByLabelText('Prompt provider'), {
      target: { value: 'openrouter' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].checkpoints[0]).toMatchObject({
      promptGate: {
        provider: 'openrouter',
      },
    });
    expect(onSave.mock.calls[0][0].checkpoints[0]).not.toHaveProperty('provider');
  });
});
