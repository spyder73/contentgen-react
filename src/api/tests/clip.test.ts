import axios from 'axios';
import ClipAPI from '../clip';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('clip create-from-json reference normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.post.mockResolvedValue({
      data: { clip_prompt_id: 'clip-1' },
    } as any);
  });

  it('moves legacy outputSpec.referenceImages into metadata.reference_image_url', async () => {
    await ClipAPI.createClipPromptFromJson(
      JSON.stringify({
        name: 'Legacy Prompt',
        imagePrompts: [
          {
            prompt: 'Poster',
            outputSpec: {
              provider: 'runware',
              model: 'image-1',
              referenceImages: [{ inputImage: 'https://cdn.example.com/ref-image.png' }],
            },
          },
        ],
        aiVideoPrompts: [
          {
            prompt: 'Shot',
            outputSpec: {
              provider: 'runware',
              model: 'video-1',
              referenceImages: [{ inputImage: 'https://cdn.example.com/ref-video-frame.png' }],
            },
          },
        ],
      })
    );

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/clips'),
      expect.any(Object)
    );

    const payload = mockedAxios.post.mock.calls[0]?.[1] as Record<string, any>;
    expect(payload.imagePrompts[0].metadata.reference_image_url).toBe(
      'https://cdn.example.com/ref-image.png'
    );
    expect(payload.aiVideoPrompts[0].metadata.reference_image_url).toBe(
      'https://cdn.example.com/ref-video-frame.png'
    );
    expect(payload.imagePrompts[0].outputSpec.referenceImages).toBeUndefined();
    expect(payload.aiVideoPrompts[0].outputSpec.referenceImages).toBeUndefined();
  });

  it('applies top-level reference_assets fallback when prompt metadata lacks a reference url', async () => {
    await ClipAPI.createClipPromptFromJson(
      JSON.stringify({
        name: 'Fallback Prompt',
        metadata: {
          reference_assets: [
            { media_id: 'ref-1', url: 'https://cdn.example.com/ref-1.png' },
            { media_id: 'ref-2', url: 'https://cdn.example.com/ref-2.png' },
          ],
        },
        aiVideoPrompts: [
          { prompt: 'Shot 1' },
          { prompt: 'Shot 2' },
        ],
      })
    );

    const payload = mockedAxios.post.mock.calls[0]?.[1] as Record<string, any>;
    expect(payload.aiVideoPrompts[0].metadata.reference_image_url).toBe(
      'https://cdn.example.com/ref-1.png'
    );
    expect(payload.aiVideoPrompts[1].metadata.reference_image_url).toBe(
      'https://cdn.example.com/ref-2.png'
    );
  });
});
