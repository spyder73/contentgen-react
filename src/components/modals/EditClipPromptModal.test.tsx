import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EditClipPromptModal from './EditClipPromptModal';
import API from '../../api/api';
import { ClipPrompt } from '../../api/structs';

jest.mock('../../api/api', () => ({
  __esModule: true,
  default: {
    getClipStyles: jest.fn(),
    getClipStyleSchema: jest.fn(),
    getAvailableMedia: jest.fn(),
    editClipPrompt: jest.fn(),
  },
}));

const mockedApi = API as jest.Mocked<typeof API>;

const clip: ClipPrompt = {
  id: 'clip-1',
  name: 'Clip One',
  style: { style: 'standard' },
  metadata: {},
  file_urls: [],
  media: {
    images: [],
    ai_videos: [],
    audios: [],
  },
};

describe('EditClipPromptModal music attachment flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.getClipStyles.mockResolvedValue([
      { id: 'standard', name: 'Standard', description: 'Default style' },
    ]);
    mockedApi.getClipStyleSchema.mockResolvedValue({
      id: 'standard',
      name: 'Standard',
      description: 'Default style',
      metadataFields: [],
      mediaMetadataFields: {
        image: [],
        ai_video: [],
        audio: [],
      },
    });
    mockedApi.getAvailableMedia.mockResolvedValue([
      {
        id: 'audio-1',
        type: 'audio',
        name: 'Theme Song',
        url: 'https://cdn.example.com/theme-song.mp3',
        mime_type: 'audio/mpeg',
      },
    ]);
    mockedApi.editClipPrompt.mockResolvedValue({} as any);
  });

  it('uses media-library picker and does not render attach-url music controls', async () => {
    render(
      <EditClipPromptModal
        isOpen
        clip={clip}
        onClose={() => undefined}
        onSave={() => undefined}
      />
    );

    await screen.findByText('Music Attachment');
    expect(screen.queryByPlaceholderText('Attach music from URL...')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Attach URL' })).not.toBeInTheDocument();

    const musicOption = await screen.findByRole('option', { name: /Theme Song \(audio\)/i });
    const musicSelect = musicOption.closest('select');
    expect(musicSelect).toBeTruthy();
    fireEvent.change(musicSelect as HTMLSelectElement, { target: { value: 'audio-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockedApi.editClipPrompt).toHaveBeenCalledWith(
        'clip-1',
        expect.objectContaining({
          music_media_id: 'audio-1',
        })
      );
    });
  });
});
