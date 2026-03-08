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

  it('falls back from /media/library to legacy /media on 405', async () => {
    mockedAxios.get
      .mockRejectedValueOnce({ response: { status: 405 } } as any)
      .mockResolvedValueOnce({
        data: {
          items: [
            {
              media_id: 'media-legacy-1',
              type: 'image',
              name: 'legacy-cover.png',
            },
          ],
        },
      } as any);

    const items = await MediaAPI.listMediaLibrary({ type: 'image' });

    expect(items).toEqual([
      expect.objectContaining({
        media_id: 'media-legacy-1',
      }),
    ]);
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/media/library'),
      expect.objectContaining({ params: expect.objectContaining({ type: 'image' }) })
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/media'),
      expect.objectContaining({ params: expect.objectContaining({ type: 'image' }) })
    );
  });

  it('falls back from /media/library/upload to legacy /media/upload on 404', async () => {
    mockedAxios.post
      .mockRejectedValueOnce({ response: { status: 404 } } as any)
      .mockResolvedValueOnce({
        data: {
          media_item: {
            media_id: 'media-legacy-upload',
            type: 'video',
            file_name: 'legacy.mp4',
          },
        },
      } as any);

    const file = new File(['video'], 'legacy.mp4', { type: 'video/mp4' });
    const item = await MediaAPI.uploadMediaLibraryFile(file, { type: 'video' });

    expect(item).toEqual(
      expect.objectContaining({
        media_id: 'media-legacy-upload',
        type: 'video',
      })
    );
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/media/library/upload'),
      expect.any(FormData)
    );
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/media/upload'),
      expect.any(FormData)
    );
  });

  it('renames media via /media/library/:id/rename and falls back to legacy route on 405', async () => {
    mockedAxios.put
      .mockRejectedValueOnce({ response: { status: 405 } } as any)
      .mockResolvedValueOnce({
        data: {
          media_item: {
            media_id: 'media-rename-1',
            type: 'image',
            name: 'renamed-cover.png',
          },
        },
      } as any);

    const renamed = await MediaAPI.renameMediaLibraryItem('media-rename-1', 'renamed-cover.png');

    expect(renamed).toEqual(
      expect.objectContaining({
        media_id: 'media-rename-1',
        name: 'renamed-cover.png',
      })
    );
    expect(mockedAxios.put).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/media/library/media-rename-1/rename'),
      expect.objectContaining({
        name: 'renamed-cover.png',
        new_name: 'renamed-cover.png',
      })
    );
    expect(mockedAxios.put).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/media/media-rename-1/rename'),
      expect.objectContaining({
        name: 'renamed-cover.png',
      })
    );
  });
});
