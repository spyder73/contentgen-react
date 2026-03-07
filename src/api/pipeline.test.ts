import axios from 'axios';
import PipelineAPI from './pipeline';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('pipeline attachment normalization', () => {
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
        initial_attachments: [
          {
            asset_id: 'asset-1',
            media_type: 'image',
            asset_url: 'https://cdn.example.com/asset-1.png',
            mimeType: 'image/png',
            file_name: 'cover',
            createdAt: '2026-01-01T00:00:00Z',
            sizeBytes: 1024,
            metadata: { source: 'pool' },
          },
        ],
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

    expect(run.initial_attachments).toEqual([
      expect.objectContaining({
        id: 'asset-1',
        type: 'image',
        url: 'https://cdn.example.com/asset-1.png',
        mime_type: 'image/png',
        name: 'cover',
        size_bytes: 1024,
        metadata: { source: 'pool' },
      }),
    ]);
    expect(run.results[0].attachments?.[0]).toEqual(
      expect.objectContaining({
        id: 'attachment-2',
        name: 'output-frame',
      })
    );
  });

  it('normalizes attachment lists in list pipeline responses', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        {
          id: 'run-2',
          pipeline_template_id: 'template-1',
          initial_input: 'Prompt',
          current_checkpoint: 1,
          status: 'completed',
          auto_mode: true,
          initial_attachments: null,
          results: [
            {
              checkpoint_id: 'step-1',
              status: 'completed',
              input: 'input',
              output: 'output',
              regenerate_count: 0,
              attachments: 'invalid-payload',
            },
          ],
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
    } as any);

    const runs = await PipelineAPI.listPipelines();

    expect(runs[0].initial_attachments).toEqual([]);
    expect(runs[0].results[0].attachments).toEqual([]);
  });

  it('sends normalized music media id and initial attachments on pipeline start', async () => {
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
          media_id: ' music-77 ',
          name: ' Intro track ',
          metadata: { role: 'music' },
        },
        {
          type: ' ',
          source: 'url',
          url: 'https://cdn.example.com/invalid',
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
            media_id: 'music-77',
            name: 'Intro track',
            filename: 'Intro track',
            metadata: { role: 'music' },
          }),
        ]),
      })
    );
    expect((mockedAxios.post.mock.calls[0]?.[1] as any).initial_attachments).toHaveLength(1);
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

    const response = await PipelineAPI.injectCheckpointPrompt('run-7', 2, 'Prefer tighter framing.', {
      autoRegenerate: true,
      source: 'frontend_pause_checkpoint',
      mode: 'with_prior_output_context',
    });

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
});
