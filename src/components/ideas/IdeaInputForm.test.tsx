import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import IdeaInputForm from './IdeaInputForm';
import API from '../../api/api';
import { PipelineTemplate } from '../../api/structs';
import { AssetPoolItem } from './assetPool';

jest.mock('../../api/api', () => ({
  __esModule: true,
  default: {
    getAvailableMedia: jest.fn(),
  },
}));

const mockedApi = API as jest.Mocked<typeof API>;

const templates: PipelineTemplate[] = [
  {
    id: 'template-1',
    name: 'Idea Template',
    description: 'desc',
    checkpoints: [],
    version: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const templateWithRequiredAssets: PipelineTemplate[] = [
  {
    id: 'template-required',
    name: 'Template With Requirements',
    description: 'desc',
    checkpoints: [
      {
        id: 'draft',
        name: 'Draft',
        prompt_template_id: 'prompt-1',
        input_mapping: {},
        requires_confirm: false,
        allow_regenerate: true,
        allow_attachments: true,
        required_assets: [{ id: 'need-image', label: 'Input Image', kind: 'image', min_count: 1 }],
      },
    ],
    version: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('IdeaInputForm attachment pool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.getAvailableMedia.mockResolvedValue([]);
  });

  it('collapses and expands the attachment pool', async () => {
    render(
      <IdeaInputForm
        templates={templates}
        onStart={async () => undefined}
      />
    );

    await waitFor(() => {
      expect(mockedApi.getAvailableMedia).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Music Media')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(screen.queryByText('Music Media')).not.toBeInTheDocument();
    expect(screen.getByText(/collapsed/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(screen.getByText('Music Media')).toBeInTheDocument();
    expect(screen.getByText(/expanded/i)).toBeInTheDocument();
  });

  it('adds dropped files into the attachment pool', async () => {
    render(
      <IdeaInputForm
        templates={templates}
        onStart={async () => undefined}
      />
    );

    const dropArea = screen.getByText('Drop files here or use the picker below.').closest('div');
    expect(dropArea).not.toBeNull();

    const file = new File(['image-bytes'], 'cover.png', { type: 'image/png' });

    fireEvent.drop(dropArea as HTMLElement, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('cover.png')).toBeInTheDocument();
      expect(screen.getByText(/1 attached/i)).toBeInTheDocument();
    });
  });

  it('blocks generate until required checkpoint assets are bound', async () => {
    const onStart = jest.fn<Promise<void>, any[]>(async () => undefined);
    mockedApi.getAvailableMedia.mockResolvedValue([
      {
        id: 'media-1',
        type: 'image',
        name: 'Cover Art',
        url: 'https://cdn.example.com/cover-art.png',
        mime_type: 'image/png',
      },
    ]);

    render(<IdeaInputForm templates={templateWithRequiredAssets} onStart={onStart} />);

    fireEvent.change(screen.getByPlaceholderText('Describe your video idea...'), {
      target: { value: 'Create a launch teaser' },
    });

    expect(
      screen.getByText('Required checkpoint assets are missing. Bind required items below before generating.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Cover Art')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.click(screen.getByLabelText('Cover Art (image · media)'));
    expect(screen.getByRole('button', { name: 'Generate' })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => expect(onStart).toHaveBeenCalledTimes(1));
    const submittedAttachments = onStart.mock.calls[0][3];
    expect(submittedAttachments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          media_id: 'media-1',
          checkpoint_id: 'draft',
        }),
      ])
    );
  });

  it('maps generated-output reuse bindings into start payload references', async () => {
    const onStart = jest.fn<Promise<void>, any[]>(async () => undefined);
    mockedApi.getAvailableMedia.mockResolvedValueOnce([]);

    const generatedAssets: AssetPoolItem[] = [
      {
        id: 'generated:asset-1',
        media_id: 'media-gen-1',
        type: 'image',
        kind: 'image',
        source: 'generated',
        name: 'Generated Frame',
        url: 'https://cdn.example.com/generated-frame.png',
        checkpoint_id: 'split',
        checkpoint_name: 'Split',
        checkpoint_index: 0,
        run_id: 'run-123',
      },
    ];

    render(
      <IdeaInputForm
        templates={templateWithRequiredAssets}
        onStart={onStart}
        generatedAssets={generatedAssets}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Describe your video idea...'), {
      target: { value: 'Build a sequel teaser' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.click(screen.getByLabelText('Generated Frame (image · generated)'));
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => expect(onStart).toHaveBeenCalledTimes(1));
    const submittedAttachments = onStart.mock.calls[0][3];
    expect(submittedAttachments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          media_id: 'media-gen-1',
          checkpoint_id: 'draft',
          source_checkpoint_id: 'split',
          source_run_id: 'run-123',
        }),
      ])
    );
  });
});
