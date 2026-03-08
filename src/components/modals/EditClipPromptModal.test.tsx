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

const clipWithInheritedAttachments: ClipPrompt = {
  ...clip,
  id: 'clip-2',
  metadata: {
    music_media_id: 'audio-inherited-1',
    attachment_provenance: [
      {
        id: 'generated-asset-1',
        media_id: 'generated-asset-1',
        type: 'image',
        name: 'Generated Keyframe',
        source: 'generated',
        source_checkpoint_id: 'draft',
        source_checkpoint_name: 'Draft',
        source_run_id: 'run-7',
      },
      {
        id: 'audio-inherited-1',
        media_id: 'audio-inherited-1',
        type: 'audio',
        name: 'Run Music',
        source: 'media',
        role: 'music',
      },
    ],
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

    const musicOption = await screen.findByRole('option', { name: /Theme Song \(audio/i });
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

  it('renders inherited provenance and allows generated reference toggles', async () => {
    mockedApi.getAvailableMedia.mockResolvedValue([]);

    render(
      <EditClipPromptModal
        isOpen
        clip={clipWithInheritedAttachments}
        onClose={() => undefined}
        onSave={() => undefined}
      />
    );

    await screen.findByText('Inherited Attachments');
    expect(screen.getByText('Generated Keyframe')).toBeInTheDocument();
    expect(screen.getByText(/from Draft/i)).toBeInTheDocument();
    expect(screen.getByText('Run Music')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Use as Ref' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockedApi.editClipPrompt).toHaveBeenCalledWith(
        'clip-2',
        expect.objectContaining({
          music_media_id: 'audio-inherited-1',
          metadata: expect.objectContaining({
            reference_assets: expect.arrayContaining([
              expect.objectContaining({
                media_id: 'generated-asset-1',
                source: 'generated',
              }),
            ]),
          }),
        })
      );
    });
  });

  it('keeps inherited auto-bound music visible and editable when not in media API list', async () => {
    mockedApi.getAvailableMedia.mockResolvedValue([]);

    render(
      <EditClipPromptModal
        isOpen
        clip={clipWithInheritedAttachments}
        onClose={() => undefined}
        onSave={() => undefined}
      />
    );

    await screen.findByText('Music Attachment');
    expect(screen.getByText(/Selected: Run Music/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Current selection \(audio-inherited-1\)/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockedApi.editClipPrompt).toHaveBeenCalledWith(
        'clip-2',
        expect.objectContaining({
          music_media_id: null,
        })
      );
    });
  });
});
