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
});
