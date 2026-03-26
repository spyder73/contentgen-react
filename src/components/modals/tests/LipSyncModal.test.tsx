import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LipSyncModal from '../LipSyncModal';
import API from '../../../api/api';
import { MediaItem } from '../../../api/structs/media';

jest.mock('../../../api/api', () => ({
  __esModule: true,
  default: {
    lipSyncMedia: jest.fn(),
  },
}));

jest.mock('../../../hooks/useToast', () => ({
  useToast: () => jest.fn(),
}));

const mockedApi = API as jest.Mocked<typeof API>;

const videoItem: MediaItem = {
  id: 'video-1',
  type: 'video',
  prompt: 'A talking character',
  file_url: 'https://cdn.example.com/video.mp4',
  metadata: {
    scene_id: 'scene-001',
    subtitles: 'Hello, world!',
  },
};

const audioItem: MediaItem = {
  id: 'audio-1',
  type: 'audio',
  prompt: 'Narration take 1',
  file_url: 'https://cdn.example.com/audio.mp3',
  metadata: {
    scene_id: 'scene-001',
  },
};

const audioItemOtherScene: MediaItem = {
  id: 'audio-2',
  type: 'audio',
  prompt: 'Narration take 2',
  file_url: 'https://cdn.example.com/audio2.mp3',
  metadata: {
    scene_id: 'scene-002',
  },
};

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  clipId: 'clip-abc',
  video: videoItem,
  audios: [audioItem, audioItemOtherScene],
  onSuccess: jest.fn(),
};

describe('LipSyncModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.lipSyncMedia.mockResolvedValue({});
  });

  it('renders both tabs', () => {
    render(<LipSyncModal {...defaultProps} />);
    expect(screen.getByText('Text + Voice')).toBeInTheDocument();
    expect(screen.getByText('Use Audio Clip')).toBeInTheDocument();
  });

  it('pre-fills text field from video.metadata.subtitles', () => {
    render(<LipSyncModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('What should the character say?');
    expect(textarea).toHaveValue('Hello, world!');
  });

  it('text field is empty when video has no subtitles metadata', () => {
    const videoNoSubs: MediaItem = {
      ...videoItem,
      metadata: { scene_id: 'scene-001' },
    };
    render(<LipSyncModal {...defaultProps} video={videoNoSubs} />);
    const textarea = screen.getByPlaceholderText('What should the character say?');
    expect(textarea).toHaveValue('');
  });

  it('submit on Text+Voice tab calls API.lipSyncMedia with text/voice/speed/pitch payload', async () => {
    render(<LipSyncModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText('What should the character say?');
    fireEvent.change(textarea, { target: { value: 'Say this line' } });

    fireEvent.click(screen.getByRole('button', { name: 'Start Lip Sync' }));

    await waitFor(() => {
      expect(mockedApi.lipSyncMedia).toHaveBeenCalledWith(
        'clip-abc',
        'video-1',
        { text: 'Say this line', voice: 'auto', speed: 1.0, pitch: 0.0 }
      );
    });
  });

  it('submit on Use Audio Clip tab calls API.lipSyncMedia with audio_media_id payload', async () => {
    render(<LipSyncModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Use Audio Clip'));

    // audio-1 should be pre-selected (same scene_id); confirm by submitting directly
    fireEvent.click(screen.getByRole('button', { name: 'Start Lip Sync' }));

    await waitFor(() => {
      expect(mockedApi.lipSyncMedia).toHaveBeenCalledWith(
        'clip-abc',
        'video-1',
        { audio_media_id: 'audio-1' }
      );
    });
  });

  it('does not submit and shows no API call when text tab has empty text', async () => {
    const videoNoSubs: MediaItem = {
      ...videoItem,
      metadata: { scene_id: 'scene-001' },
    };
    render(<LipSyncModal {...defaultProps} video={videoNoSubs} />);

    fireEvent.click(screen.getByRole('button', { name: 'Start Lip Sync' }));

    // Allow async path to settle
    await waitFor(() => {
      expect(mockedApi.lipSyncMedia).not.toHaveBeenCalled();
    });
  });

  it('pre-selects audio dropdown when an audio item shares scene_id with the video', async () => {
    render(<LipSyncModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Use Audio Clip'));

    const select = await screen.findByRole('combobox');
    expect(select).toHaveValue('audio-1');
  });
});
