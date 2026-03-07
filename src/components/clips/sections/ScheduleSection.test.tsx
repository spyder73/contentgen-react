import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ScheduleSection from './ScheduleSection';
import API from '../../../api/api';
import { Account } from '../../../api/structs/user';

jest.mock('../../../api/api', () => ({
  __esModule: true,
  default: {
    scheduleClip: jest.fn(),
    editClipMetadata: jest.fn(),
  },
}));

const mockedApi = API as jest.Mocked<typeof API>;

const activeAccount: Account = {
  _id: 'acc-1',
  username: 'creator',
  platforms: ['instagram', 'tiktok', 'youtube'],
  is_ai: false,
  autoposting_properties: { enabled: false },
  scheduled_times: [],
};

describe('ScheduleSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.scheduleClip.mockResolvedValue({
      success: true,
      status: 'queued',
      run_id: 'run-1',
    });
    mockedApi.editClipMetadata.mockResolvedValue({});
  });

  it('sends only selected platforms when scheduling', async () => {
    render(
      <ScheduleSection
        clipId="clip-1"
        initialCaption="Initial caption"
        activeAccount={activeAccount}
        fileUrls={['https://cdn.example.com/clip.mp4']}
      />
    );

    fireEvent.click(screen.getByLabelText('tiktok'));
    fireEvent.click(screen.getByRole('button', { name: /schedule to instagram, youtube/i }));

    await screen.findByText(/scheduling run queued/i);
    await waitFor(() => {
      expect(mockedApi.scheduleClip).toHaveBeenCalledWith('clip-1', ['instagram', 'youtube']);
    });
    expect(mockedApi.editClipMetadata).not.toHaveBeenCalled();
  });

  it('shows and persists edited caption before scheduling', async () => {
    render(
      <ScheduleSection
        clipId="clip-2"
        initialCaption="Old caption"
        activeAccount={activeAccount}
        fileUrls={['https://cdn.example.com/clip.mp4']}
      />
    );

    const captionInput = screen.getByPlaceholderText('Write the post caption...');
    expect(captionInput).toHaveValue('Old caption');

    fireEvent.change(captionInput, { target: { value: 'Updated caption for publish' } });
    fireEvent.click(screen.getByRole('button', { name: /schedule to instagram, tiktok, youtube/i }));

    await screen.findByText(/scheduling run queued/i);
    await waitFor(() => {
      expect(mockedApi.editClipMetadata).toHaveBeenCalledWith('clip-2', 'caption', 'Updated caption for publish');
      expect(mockedApi.scheduleClip).toHaveBeenCalledWith('clip-2', ['instagram', 'tiktok', 'youtube']);
    });

    expect(mockedApi.editClipMetadata.mock.invocationCallOrder[0]).toBeLessThan(
      mockedApi.scheduleClip.mock.invocationCallOrder[0]
    );
  });
});
