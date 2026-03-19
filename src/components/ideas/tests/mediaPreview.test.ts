import { resolveMediaPreviewCandidates } from '../mediaPreview';

describe('resolveMediaPreviewCandidates', () => {
  it('prefers explicit image preview fields before base media URL', () => {
    const candidates = resolveMediaPreviewCandidates({
      id: 'img-1',
      media_id: 'img-1',
      type: 'image',
      name: 'Image 1',
      url: 'https://cdn.example.com/original.png',
      thumbnail_url: 'https://cdn.example.com/thumb.png',
      preview_url: 'https://cdn.example.com/preview.png',
    });

    expect(candidates.folder).toBe('image');
    expect(candidates.image).toEqual([
      'https://cdn.example.com/preview.png',
      'https://cdn.example.com/thumb.png',
      'https://cdn.example.com/original.png',
    ]);
  });

  it('reads metadata preview aliases for generated assets', () => {
    const candidates = resolveMediaPreviewCandidates({
      id: 'video-1',
      media_id: 'video-1',
      type: 'video',
      name: 'Video 1',
      metadata: {
        preview_video_url: 'https://cdn.example.com/generated-preview.webm',
        playback_url: 'https://cdn.example.com/generated-playback.mp4',
        poster_url: 'https://cdn.example.com/generated-poster.jpg',
      },
    });

    expect(candidates.video).toEqual([
      'https://cdn.example.com/generated-preview.webm',
      'https://cdn.example.com/generated-playback.mp4',
    ]);
    expect(candidates.poster).toEqual(['https://cdn.example.com/generated-poster.jpg']);
  });

  it('uses playback/stream aliases as video candidates when mime indicates video', () => {
    const candidates = resolveMediaPreviewCandidates({
      id: 'video-2',
      media_id: 'video-2',
      type: 'video',
      name: 'Video 2',
      mime_type: 'video/mp4',
      playback_url: 'https://cdn.example.com/video2-playback',
      url: 'https://cdn.example.com/video2-main',
    });

    expect(candidates.video).toEqual([
      'https://cdn.example.com/video2-playback',
      'https://cdn.example.com/video2-main',
    ]);
  });

  it('still attempts base media URL for video items without mime/extensions', () => {
    const candidates = resolveMediaPreviewCandidates({
      id: 'video-3',
      media_id: 'video-3',
      type: 'video',
      name: 'Video 3',
      url: 'https://cdn.example.com/tokenized/playback',
    });

    expect(candidates.video).toEqual(['https://cdn.example.com/tokenized/playback']);
  });
});
