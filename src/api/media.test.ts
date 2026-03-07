import axios from 'axios';
import MediaAPI from './media';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('media library API normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes media library list payloads into ID-first entries', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            media_id: 'media-1',
            media_type: 'image',
            file_name: 'cover.png',
            file_url: 'https://cdn.example.com/cover.png',
            source: 'manual_upload',
            size_bytes: '2048',
          },
          {
            id: 'media-2',
            type: 'video',
            name: 'teaser.mp4',
            url: 'https://cdn.example.com/teaser.mp4',
            origin: 'generated',
          },
        ],
      },
    } as any);

    const items = await MediaAPI.listMediaLibrary();

    expect(items).toEqual([
      {
        id: 'media-1',
        media_id: 'media-1',
        type: 'image',
        name: 'cover.png',
        url: 'https://cdn.example.com/cover.png',
        source: 'manual_upload',
        size_bytes: 2048,
      },
      {
        id: 'media-2',
        media_id: 'media-2',
        type: 'video',
        name: 'teaser.mp4',
        url: 'https://cdn.example.com/teaser.mp4',
        source: 'generated',
      },
    ]);
  });

  it('normalizes upload response and returns stable media_id', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        media_item: {
          media_id: 'media-upload-1',
          type: 'image',
          file_name: 'upload.png',
          source: 'manual_upload',
          content_type: 'image/png',
        },
      },
    } as any);

    const file = new File(['image'], 'upload.png', { type: 'image/png' });
    const item = await MediaAPI.uploadMediaLibraryFile(file, { source: 'manual_upload', type: 'image' });

    expect(item).toEqual(
      expect.objectContaining({
        id: 'media-upload-1',
        media_id: 'media-upload-1',
        type: 'image',
        name: 'upload.png',
        source: 'manual_upload',
        mime_type: 'image/png',
      })
    );
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/media/library/upload'),
      expect.any(FormData)
    );
  });
});
