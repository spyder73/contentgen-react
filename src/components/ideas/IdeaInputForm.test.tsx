import React from 'react';
import { fireEvent, render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import IdeaInputForm from './IdeaInputForm';
import API from '../../api/api';
import { PipelineTemplate } from '../../api/structs';

jest.mock('../../api/api', () => ({
  __esModule: true,
  default: {
    listMediaLibrary: jest.fn(),
    uploadMediaLibraryFile: jest.fn(),
    editMediaMetadata: jest.fn(),
    renameMediaLibraryItem: jest.fn(),
    deleteMediaItem: jest.fn(),
  },
}));

const mockedApi = API as jest.Mocked<typeof API>;

const templates: PipelineTemplate[] = [
  {
    id: 'template-1',
    name: 'Idea Template',
    description: 'desc',
    checkpoints: [
      {
        id: 'attach-step',
        name: 'Attach Step',
        prompt_template_id: '',
        input_mapping: {},
        requires_confirm: false,
        allow_regenerate: false,
        allow_attachments: true,
      },
    ],
    version: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('IdeaInputForm modal attachment flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.listMediaLibrary.mockResolvedValue([]);
    mockedApi.uploadMediaLibraryFile.mockResolvedValue({
      id: 'media-upload-1',
      media_id: 'media-upload-1',
      type: 'image',
      name: 'upload.png',
      source: 'manual_upload',
      mime_type: 'image/png',
    });
    mockedApi.editMediaMetadata.mockResolvedValue({});
    mockedApi.renameMediaLibraryItem.mockResolvedValue({
      id: 'media-image-1',
      media_id: 'media-image-1',
      type: 'image',
      name: 'poster-renamed.png',
      source: 'manual_upload',
    });
    mockedApi.deleteMediaItem.mockResolvedValue({});
  });

  it('selects files in modal and sends them as initial run attachments', async () => {
    const onStart = jest.fn<Promise<void>, any[]>(async () => undefined);
    mockedApi.listMediaLibrary.mockResolvedValue([
      {
        id: 'media-cover-1',
        media_id: 'media-cover-1',
        type: 'image',
        name: 'Cover Art',
        source: 'manual_upload',
        mime_type: 'image/png',
      },
      {
        id: 'media-video-1',
        media_id: 'media-video-1',
        type: 'video',
        name: 'Launch Teaser',
        source: 'generated',
        mime_type: 'video/mp4',
      },
    ]);

    render(<IdeaInputForm templates={templates} onStart={onStart} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Files To Run' }));
    expect(await screen.findByText('Select Files For Next Run')).toBeInTheDocument();

    await screen.findByRole('button', { name: /Cover Art/i });
    fireEvent.click(screen.getByRole('button', { name: /Cover Art/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Selected (1)' }));

    expect(screen.getByText('Run Attachments')).toBeInTheDocument();
    expect(screen.getByText(/Cover Art/)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Describe your video idea...'), {
      target: { value: 'Create a launch teaser run.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => expect(onStart).toHaveBeenCalledTimes(1));
    const submittedAttachments = onStart.mock.calls[0][3];
    expect(submittedAttachments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          media_id: 'media-cover-1',
          source: 'media',
          state: 'selected',
        }),
      ])
    );
  });

  it('opens upload-manage modal when top-header signal changes', async () => {
    const { rerender } = render(
      <IdeaInputForm templates={templates} onStart={async () => undefined} openLibrarySignal={0} />
    );

    rerender(<IdeaInputForm templates={templates} onStart={async () => undefined} openLibrarySignal={1} />);

    expect(await screen.findByText('Media Upload Library')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload Files' })).toBeInTheDocument();
  });

  it('filters browse results by folder and source', async () => {
    mockedApi.listMediaLibrary.mockResolvedValue([
      {
        id: 'media-image-1',
        media_id: 'media-image-1',
        type: 'image',
        name: 'Poster',
        source: 'manual_upload',
      },
      {
        id: 'media-video-1',
        media_id: 'media-video-1',
        type: 'video',
        name: 'Generated Trailer',
        source: 'generated',
      },
      {
        id: 'media-audio-1',
        media_id: 'media-audio-1',
        type: 'audio',
        name: 'Narration',
        source: 'manual_upload',
      },
    ]);

    render(<IdeaInputForm templates={templates} onStart={async () => undefined} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Files To Run' }));
    await screen.findByText('Select Files For Next Run');
    await waitForElementToBeRemoved(() => screen.queryByText('Loading library files...'));
    await screen.findByRole('button', { name: /Generated Trailer/i });

    fireEvent.click(screen.getByRole('button', { name: /Video Folder/i }));
    expect(screen.getByRole('button', { name: /Generated Trailer/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Poster/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Filter by source'), {
      target: { value: 'uploaded' },
    });
    expect(screen.queryByRole('button', { name: /Generated Trailer/i })).not.toBeInTheDocument();
  });

  it('saves metadata context for selected file in manage mode', async () => {
    mockedApi.listMediaLibrary.mockResolvedValue([
      {
        id: 'media-image-1',
        media_id: 'media-image-1',
        type: 'image',
        name: 'Poster',
        source: 'manual_upload',
      },
    ]);

    const { rerender } = render(
      <IdeaInputForm templates={templates} onStart={async () => undefined} openLibrarySignal={0} />
    );
    rerender(<IdeaInputForm templates={templates} onStart={async () => undefined} openLibrarySignal={2} />);

    await screen.findByText('Media Upload Library');
    fireEvent.click(screen.getByRole('button', { name: 'Browse Files' }));
    await waitForElementToBeRemoved(() => screen.queryByText('Loading library files...'));
    fireEvent.click(await screen.findByRole('button', { name: /Poster/i }));
    fireEvent.change(screen.getByPlaceholderText('Add context for this file (stored in metadata)...'), {
      target: { value: 'Use this as hero visual in opening scene.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Context' }));

    await waitFor(() => {
      expect(mockedApi.editMediaMetadata).toHaveBeenCalledWith(
        'media-image-1',
        'user_context',
        'Use this as hero visual in opening scene.'
      );
    });
  });

  it('uploads selected files in manage mode', async () => {
    const { rerender } = render(
      <IdeaInputForm templates={templates} onStart={async () => undefined} openLibrarySignal={0} />
    );
    rerender(<IdeaInputForm templates={templates} onStart={async () => undefined} openLibrarySignal={3} />);

    await screen.findByText('Media Upload Library');
    const uploadInput = screen.getByLabelText('File input', { selector: 'input[type="file"]' });
    const file = new File(['bytes'], 'upload.png', { type: 'image/png' });
    fireEvent.change(uploadInput, {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    await waitFor(() => {
      expect(mockedApi.uploadMediaLibraryFile).toHaveBeenCalledWith(
        file,
        expect.objectContaining({ source: 'manual_upload' })
      );
    });
    await waitFor(() => {
      expect(screen.getByText(/Uploaded 1 file successfully/i)).toBeInTheDocument();
    });
  });

  it('supports square attach tile drag/drop and preview in upload tab', async () => {
    const { rerender } = render(
      <IdeaInputForm templates={templates} onStart={async () => undefined} openLibrarySignal={0} />
    );
    rerender(<IdeaInputForm templates={templates} onStart={async () => undefined} openLibrarySignal={4} />);

    await screen.findByText('Media Upload Library');
    const tile = screen.getByRole('button', { name: 'Attach files tile' });
    const dropped = new File(['audio-bytes'], 'voice.wav', { type: 'audio/wav' });
    fireEvent.drop(tile, { dataTransfer: { files: [dropped] } });

    expect(screen.getByText(/1 file selected/i)).toBeInTheDocument();
    expect(screen.getByText('voice.wav')).toBeInTheDocument();
  });

  it('hides context/remove controls in run-attach select mode and shows guidance hint', async () => {
    mockedApi.listMediaLibrary.mockResolvedValue([
      {
        id: 'media-image-1',
        media_id: 'media-image-1',
        type: 'image',
        name: 'Poster',
        source: 'manual_upload',
        url: 'https://cdn.example.com/poster.png',
      },
    ]);

    render(<IdeaInputForm templates={templates} onStart={async () => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add Files To Run' }));
    await screen.findByText('Select Files For Next Run');
    await waitForElementToBeRemoved(() => screen.queryByText('Loading library files...'));
    fireEvent.click(screen.getByRole('button', { name: /Poster/i }));

    expect(screen.queryByRole('button', { name: 'Save Context' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove File' })).not.toBeInTheDocument();
    expect(screen.getByText(/Removal and metadata editing are available/i)).toBeInTheDocument();
  });

  it('renders lightweight image/video/audio previews in browse mode', async () => {
    mockedApi.listMediaLibrary.mockResolvedValue([
      {
        id: 'media-image-1',
        media_id: 'media-image-1',
        type: 'image',
        name: 'Poster',
        source: 'manual_upload',
        url: 'https://cdn.example.com/poster.png',
        mime_type: 'image/png',
      },
      {
        id: 'media-video-1',
        media_id: 'media-video-1',
        type: 'video',
        name: 'Teaser',
        source: 'manual_upload',
        url: 'https://cdn.example.com/teaser.mp4',
        mime_type: 'video/mp4',
      },
      {
        id: 'media-audio-1',
        media_id: 'media-audio-1',
        type: 'audio',
        name: 'Narration',
        source: 'manual_upload',
        url: 'https://cdn.example.com/narration.mp3',
        mime_type: 'audio/mpeg',
      },
    ]);

    render(<IdeaInputForm templates={templates} onStart={async () => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add Files To Run' }));
    await screen.findByText('Select Files For Next Run');
    await waitForElementToBeRemoved(() => screen.queryByText('Loading library files...'));

    expect(screen.getByAltText('Poster')).toBeInTheDocument();
    expect(document.querySelectorAll('video').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Narration/i }));
    expect(document.querySelector('audio')).toBeInTheDocument();
  });

  it('shows requirement warning and direct attach CTA when required assets are missing', () => {
    const templatesWithRequired: PipelineTemplate[] = [
      {
        ...templates[0],
        checkpoints: [
          {
            ...templates[0].checkpoints[0],
            required_assets: [{ id: 'req-image', label: 'Reference Image', kind: 'image', min_count: 1 }],
          },
        ],
      },
    ];

    render(<IdeaInputForm templates={templatesWithRequired} onStart={async () => undefined} />);

    expect(screen.getByText(/Required checkpoint assets are missing/i)).toBeInTheDocument();
    expect(screen.getByText('Missing Required Checkpoint Assets')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Attach Browser' })).toBeInTheDocument();
  });

  it('hides run-attach controls when pipeline has no attachment requirements', () => {
    const templateWithoutAttachment: PipelineTemplate[] = [
      {
        ...templates[0],
        id: 'template-no-attach',
        checkpoints: [
          {
            ...templates[0].checkpoints[0],
            id: 'prompt-only',
            allow_attachments: false,
            required_assets: [],
          },
        ],
      },
    ];

    render(<IdeaInputForm templates={templateWithoutAttachment} onStart={async () => undefined} />);

    expect(screen.queryByRole('button', { name: 'Add Files To Run' })).not.toBeInTheDocument();
    expect(screen.getByText(/does not require attachments/i)).toBeInTheDocument();
  });

  it('surfaces duplicate-name inline error when rename conflicts', async () => {
    mockedApi.listMediaLibrary.mockResolvedValue([
      {
        id: 'media-image-1',
        media_id: 'media-image-1',
        type: 'image',
        name: 'Poster',
        source: 'manual_upload',
      },
    ]);
    mockedApi.renameMediaLibraryItem.mockRejectedValue({
      response: { status: 409, data: { error: 'duplicate media name' } },
    } as any);

    const { rerender } = render(
      <IdeaInputForm templates={templates} onStart={async () => undefined} openLibrarySignal={0} />
    );
    rerender(<IdeaInputForm templates={templates} onStart={async () => undefined} openLibrarySignal={5} />);

    await screen.findByText('Media Upload Library');
    fireEvent.click(screen.getByRole('button', { name: 'Browse Files' }));
    await waitForElementToBeRemoved(() => screen.queryByText('Loading library files...'));
    fireEvent.click(screen.getByRole('button', { name: /Poster/i }));
    fireEvent.change(screen.getByPlaceholderText('Rename file...'), {
      target: { value: 'Poster' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

    await waitFor(() => {
      expect(screen.getByText('A file with this name already exists. Choose a different name and try again.')).toBeInTheDocument();
    });
  });
});
