import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import IdeaInputForm from './IdeaInputForm';
import API from '../../api/api';
import { PipelineTemplate } from '../../api/structs';

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
});
