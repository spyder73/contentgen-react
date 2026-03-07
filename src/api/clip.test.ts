import axios from 'axios';
import ClipAPI from './clip';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('clip API normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes available media list from mixed backend payload shapes', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        media_files: [
          {
            media_id: 'media-1',
            media_type: 'audio',
            file_name: 'track-a.mp3',
            file_url: 'https://cdn.example.com/track-a.mp3',
            content_type: 'audio/mpeg',
          },
          'https://cdn.example.com/fallback.png',
        ],
      },
    } as any);

    const media = await ClipAPI.getAvailableMedia();

    expect(media).toEqual([
      {
        id: 'media-1',
        media_id: 'media-1',
        type: 'audio',
        name: 'track-a.mp3',
        url: 'https://cdn.example.com/track-a.mp3',
        mime_type: 'audio/mpeg',
      },
      {
        id: 'https://cdn.example.com/fallback.png',
        media_id: 'https://cdn.example.com/fallback.png',
        type: 'unknown',
        name: 'https://cdn.example.com/fallback.png',
        url: 'https://cdn.example.com/fallback.png',
      },
    ]);
  });
});
