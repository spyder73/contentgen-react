import axios from 'axios';
import PipelineAPI from '../pipeline';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('pipeline API boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes pipeline run attachments from mixed backend keys', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        id: 'run-1',
        pipeline_template_id: 'template-1',
        initial_input: 'Prompt',
        current_checkpoint: 0,
        status: 'running',
        auto_mode: true,
        results: [
          {
            checkpoint_id: 'step-1',
            status: 'completed',
            input: 'input',
            output: 'output',
            regenerate_count: 0,
            attachments: [
              {
                id: 'attachment-2',
                type: 'image',
                url: 'https://cdn.example.com/asset-2.png',
                mime_type: 'image/png',
                name: 'output-frame',
                created_at: '2026-01-01T00:00:00Z',
              },
            ],
          },
        ],
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    } as any);

    const run = await PipelineAPI.getPipeline('run-1');

    expect(run.results[0].attachments?.[0]).toEqual(
      expect.objectContaining({
        id: 'attachment-2',
        name: 'output-frame',
      })
    );
  });

  it('preserves awaiting_asset checkpoint status on pipeline read', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        id: 'run-asset-wait',
        pipeline_template_id: 'template-1',
        initial_input: 'Prompt',
        current_checkpoint: 1,
        status: 'paused',
        auto_mode: false,
        results: [
          {
            checkpoint_id: 'character-seed',
            status: 'awaiting_asset',
            input: 'input',
            output: '',
            error: 'Attach a required asset before continuing.',
            regenerate_count: 0,
          },
        ],
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    } as any);

    const run = await PipelineAPI.getPipeline('run-asset-wait');

    expect(run.results[0].status).toBe('awaiting_asset');
    expect(run.results[0].error).toBe('Attach a required asset before continuing.');
  });

  it('sends normalized initial attachments on pipeline start', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        run_id: 'run-3',
        status: 'running',
      },
    } as any);

    await PipelineAPI.startPipeline('template-2', 'Prompt', {
      autoMode: true,
      musicMediaId: '  music-77 ',
      initialAttachments: [
        {
          type: ' music ',
          source: ' media ',
          state: ' selected ',
          role: ' music_track ',
          media_id: ' music-77 ',
          name: ' Intro track ',
          metadata: { role: 'music' },
        },
        {
          type: ' image ',
          source: ' media ',
          role: ' seed_image ',
          scene_id: ' scene-1 ',
          frame_order: 1,
          media_id: ' seed-image-1 ',
          url: 'https://cdn.example.com/seed-image-1.png',
          metadata: { role: 'reference', seed_reference: true },
        },
      ],
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/pipelines/start'),
      expect.objectContaining({
        template_id: 'template-2',
        initial_input: 'Prompt',
        music_media_id: 'music-77',
        initial_attachments: expect.arrayContaining([
          expect.objectContaining({
            type: 'music',
            source: 'media',
            state: 'selected',
            role: 'music_track',
            media_id: 'music-77',
            name: 'Intro track',
            filename: 'Intro track',
          }),
          expect.objectContaining({
            type: 'image',
            source: 'media',
            role: 'seed_image',
            scene_id: 'scene-1',
            frame_order: 1,
            media_id: 'seed-image-1',
          }),
        ]),
      })
    );
  });

  it('posts checkpoint prompt injection with additive guidance fields', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        status: 'paused',
        checkpoint_index: 2,
        injection_count: 3,
        regenerated: true,
      },
    } as any);

    const response = await PipelineAPI.injectCheckpointPrompt(
      'run-7',
      2,
      'Prefer tighter framing.',
      {
        autoRegenerate: true,
        source: 'frontend_pause_checkpoint',
        mode: 'with_prior_output_context',
      }
    );

    expect(response).toEqual(
      expect.objectContaining({
        status: 'paused',
        checkpoint_index: 2,
        injection_count: 3,
        regenerated: true,
      })
    );
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/pipelines/run-7/checkpoints/2/inject'),
      {
        text: 'Prefer tighter framing.',
        guidance: 'Prefer tighter framing.',
        prompt: 'Prefer tighter framing.',
        auto_regenerate: true,
        source: 'frontend_pause_checkpoint',
        context_mode: 'with_prior_output_context',
        injection_mode: 'with_prior_output_context',
        include_prior_output_context: true,
        include_context: true,
        use_prior_output_context: true,
      }
    );
  });

  it('serializes backend-canonical output format and nested checkpoint ownership on update', async () => {
    mockedAxios.put.mockResolvedValueOnce({
      data: {
        id: 'template-9',
        name: 'Template 9',
        description: '',
        checkpoints: [],
        version: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    } as any);

    await PipelineAPI.updatePipelineTemplate('template-9', {
      output_format: {
        image_provider: ' runware ',
        image_model: ' runware:image-v1 ',
      },
      checkpoints: [
        {
          id: 'prompt-step',
          name: 'Prompt Step',
          type: 'prompt',
          prompt_template_id: 'prompt-1',
          input_mapping: { topic: ' initial_input ' },
          requires_confirm: false,
          allow_regenerate: true,
          promptGate: {
            provider: ' openrouter ',
            model: ' x-ai/grok-4-fast ',
          },
        },
        {
          id: 'split-step',
          name: 'Split Step',
          type: 'distributor',
          prompt_template_id: '',
          input_mapping: { source: ' checkpoint:prompt-step ' },
          requires_confirm: false,
          allow_regenerate: true,
          distributor: {
            provider: ' openrouter ',
            model: ' x-ai/grok-4-fast ',
            delimiter: ' json_array ',
            max_children: 6,
          },
        },
        {
          id: 'join-step',
          name: 'Join Step',
          type: 'connector',
          prompt_template_id: '',
          input_mapping: {},
          requires_confirm: true,
          allow_regenerate: true,
          connector: {
            strategy: 'first' as any,
            source_checkpoint_id: 'split-step',
          },
        },
        {
          id: 'generator-step',
          name: 'Generator Step',
          type: 'generator',
          prompt_template_id: 'prompt-2',
          input_mapping: { prompt: ' checkpoint:join-step ' },
          requires_confirm: false,
          allow_regenerate: true,
          generator: {
            media_type: ' image ',
            role: ' seed_image ',
            mode: ' image_to_image ',
            provider: ' runware ',
            model: ' runware:400@1 ',
          },
          required_assets: [
            { key: 'hero', type: 'image', source: 'media' },
            { key: ' ', type: ' ', source: ' ' },
          ],
        },
      ],
    });

    expect(mockedAxios.put).toHaveBeenCalledWith(
      expect.stringContaining('/pipeline-templates/template-9'),
      expect.objectContaining({
        output_format: {
          image_provider: 'runware',
          image_model: 'runware:image-v1',
        },
        checkpoints: [
          expect.objectContaining({
            id: 'prompt-step',
            promptGate: {
              provider: 'openrouter',
              model: 'x-ai/grok-4-fast',
            },
          }),
          expect.objectContaining({
            id: 'split-step',
            distributor: expect.objectContaining({
              provider: 'openrouter',
              model: 'x-ai/grok-4-fast',
              delimiter: 'json_array',
              max_children: 6,
            }),
          }),
          expect.objectContaining({
            id: 'join-step',
            connector: {
              strategy: 'collect_all',
              source_checkpoint_id: 'split-step',
            },
          }),
          expect.objectContaining({
            id: 'generator-step',
            input_mapping: { prompt: 'checkpoint:join-step' },
            required_assets: [{ key: 'hero', type: 'image', source: 'media' }],
            generator: {
              media_type: 'image',
              role: 'seed_image',
              mode: 'image_to_image',
              provider: 'runware',
              model: 'runware:400@1',
            },
          }),
        ],
      })
    );
    const updatePayload = mockedAxios.put.mock.calls[0]?.[1] as {
      output_format?: Record<string, unknown>;
    };
    expect(updatePayload.output_format).not.toHaveProperty('aspect_ratio');
    expect(updatePayload.output_format).not.toHaveProperty('long_edge');
  });

  it('serializes checkpoint required asset selectors into backend-canonical checkpoint sources', async () => {
    mockedAxios.put.mockResolvedValueOnce({
      data: {
        id: 'template-12',
        name: 'Template 12',
        description: '',
        checkpoints: [],
        version: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    } as any);

    await PipelineAPI.updatePipelineTemplate('template-12', {
      checkpoints: [
        {
          id: 'generator-step',
          name: 'Generator Step',
          type: 'generator',
          prompt_template_id: 'prompt-2',
          input_mapping: { prompt: 'checkpoint:scene-reference-prompt' },
          requires_confirm: false,
          allow_regenerate: true,
          required_assets: [
            {
              key: 'seed_image',
              type: 'image',
              source: 'checkpoint',
              checkpoint_id: 'character-seed',
            },
          ],
          generator: {
            media_type: 'image',
            role: 'reference_frame',
            mode: 'image_to_image',
            provider: 'runware',
            model: 'runware:400@1',
          },
        },
      ],
    });

    expect(mockedAxios.put).toHaveBeenCalledWith(
      expect.stringContaining('/pipeline-templates/template-12'),
      expect.objectContaining({
        checkpoints: [
          expect.objectContaining({
            id: 'generator-step',
            required_assets: [
              {
                key: 'seed_image',
                type: 'image',
                source: 'checkpoint:character-seed',
                checkpoint_id: 'character-seed',
              },
            ],
          }),
        ],
      })
    );
  });

  it('normalizes legacy template payloads on read into the canonical frontend shape', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        id: 'template-11',
        name: 'Template 11',
        description: 'desc',
        output_format: {
          aspect_ratio: '9:16',
          image_long_edge: 1536,
          image_provider: 'runware',
          image_model: 'runware:image',
        },
        checkpoints: [
          {
            id: 'prompt-step',
            name: 'Prompt Step',
            prompt_template_id: '',
            input_mapping: {},
            requires_confirm: false,
            allow_regenerate: true,
            provider: 'openrouter',
            model: 'x-ai/grok-4-fast',
          },
          {
            id: 'join-step',
            name: 'Join Step',
            type: 'connector',
            prompt_template_id: '',
            input_mapping: {},
            requires_confirm: true,
            allow_regenerate: true,
            connector: {
              strategy: 'longest',
              source_checkpoint_id: 'split-step',
            },
          },
          {
            id: 'generator-step',
            name: 'Generator Step',
            type: 'generator',
            prompt_template_id: '',
            input_mapping: { prompt: 'initial_input' },
            requires_confirm: false,
            allow_regenerate: true,
            provider: 'runware',
            model: 'runware:400@1',
            required_assets: [
              {
                key: 'seed_image',
                type: 'image',
                source: 'checkpoint:character-seed',
              },
            ],
            generator: {
              media_type: 'image',
              role: 'reference_image',
            },
          },
        ],
        version: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    } as any);

    const template = await PipelineAPI.getPipelineTemplate('template-11');

    expect(template.output_format).toEqual(
      expect.objectContaining({
        image_provider: 'runware',
        image_model: 'runware:image',
      })
    );
    expect(template.output_format).not.toHaveProperty('aspect_ratio');
    expect(template.output_format).not.toHaveProperty('long_edge');
    expect(template.checkpoints[0].promptGate).toEqual({
      provider: 'openrouter',
      model: 'x-ai/grok-4-fast',
    });
    expect(template.checkpoints[1].connector).toEqual({
      strategy: 'collect_all',
      source_checkpoint_id: 'split-step',
    });
    expect(template.checkpoints[2].generator).toEqual(
      expect.objectContaining({
        provider: 'runware',
        model: 'runware:400@1',
        mode: 'image_to_image',
      })
    );
    expect(template.checkpoints[2].required_assets).toEqual([
      expect.objectContaining({
        key: 'seed_image',
        type: 'image',
        source: 'checkpoint:character-seed',
      }),
    ]);
  });
});
