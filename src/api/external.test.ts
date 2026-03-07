import axios from 'axios';
import ExternalAPI from './external';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('external API compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses canonical /v1/schedule route first', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: true,
        status: 'uploading',
        message: 'Uploading carousel...',
      },
    } as any);

    const response = await ExternalAPI.scheduleClip('clip-1', ['tiktok']);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:81/v1/schedule',
      {
        clip_id: 'clip-1',
        platforms: ['tiktok'],
      }
    );
    expect(response).toEqual(
      expect.objectContaining({
        success: true,
        status: 'uploading',
        message: 'Uploading carousel...',
      })
    );
  });

  it('falls back to legacy /schedule route on 404/405 from /v1/schedule', async () => {
    mockedAxios.post
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 404 },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          scheduled_date: '2026-03-08T10:30:00Z',
        },
      } as any);

    const response = await ExternalAPI.scheduleClip('clip-2', ['instagram']);

    expect(mockedAxios.post).toHaveBeenNthCalledWith(1, 'http://localhost:81/v1/schedule', {
      clip_id: 'clip-2',
      platforms: ['instagram'],
    });
    expect(mockedAxios.post).toHaveBeenNthCalledWith(2, 'http://localhost:81/schedule', {
      clip_id: 'clip-2',
      platforms: ['instagram'],
    });
    expect(response).toEqual(
      expect.objectContaining({
        success: true,
        scheduled_date: '2026-03-08T10:30:00Z',
      })
    );
  });

  it('falls back to /scheduler/runs after /v1/schedule and /schedule route misses', async () => {
    mockedAxios.post
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 404 },
      })
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 405 },
      })
      .mockResolvedValueOnce({
        data: {
          run_id: 'run-legacy',
          status: 'queued',
        },
      } as any);

    const response = await ExternalAPI.scheduleClip('clip-legacy', ['youtube']);

    expect(mockedAxios.post).toHaveBeenNthCalledWith(1, 'http://localhost:81/v1/schedule', {
      clip_id: 'clip-legacy',
      platforms: ['youtube'],
    });
    expect(mockedAxios.post).toHaveBeenNthCalledWith(2, 'http://localhost:81/schedule', {
      clip_id: 'clip-legacy',
      platforms: ['youtube'],
    });
    expect(mockedAxios.post).toHaveBeenNthCalledWith(3, 'http://localhost:81/scheduler/runs', {
      clip_id: 'clip-legacy',
      platforms: ['youtube'],
    });
    expect(response).toEqual(
      expect.objectContaining({
        success: true,
        run_id: 'run-legacy',
        status: 'queued',
      })
    );
  });

  it('surfaces scheduler error messages for schedule failures', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 400,
        data: { error: 'No active account selected' },
      },
    });

    await expect(ExternalAPI.scheduleClip('clip-fail', ['instagram'])).rejects.toThrow(
      'No active account selected'
    );
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('normalizes /v1/users response variants for user/account listing', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: {
          items: [
            {
              id: '42',
              username: 'alice',
              accounts: [{ id: 'acc_1', username: 'alice_main', platforms: ['instagram'] }],
            },
          ],
          active_user: {
            id: 42,
            username: 'alice',
            accounts: [{ _id: 'acc_1', username: 'alice_main', platforms: ['instagram'] }],
          },
        },
      },
    } as any);

    const response = await ExternalAPI.getUsers();

    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:81/v1/users');
    expect(response).toEqual({
      users: [
        {
          id: 42,
          username: 'alice',
          accounts: [
            {
              _id: 'acc_1',
              username: 'alice_main',
              platforms: ['instagram'],
              is_ai: false,
              autoposting_properties: { enabled: false },
              scheduled_times: [],
            },
          ],
        },
      ],
      active_user: {
        id: 42,
        username: 'alice',
        accounts: [
          {
            _id: 'acc_1',
            username: 'alice_main',
            platforms: ['instagram'],
            is_ai: false,
            autoposting_properties: { enabled: false },
            scheduled_times: [],
          },
        ],
      },
    });
  });

  it('falls back from /v1/users to /users when needed', async () => {
    mockedAxios.get
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 404 },
      })
      .mockResolvedValueOnce({
        data: {
          users: [{ id: 7, username: 'bob', accounts: [] }],
          active_user: null,
        },
      } as any);

    const response = await ExternalAPI.getUsers();

    expect(mockedAxios.get).toHaveBeenNthCalledWith(1, 'http://localhost:81/v1/users');
    expect(mockedAxios.get).toHaveBeenNthCalledWith(2, 'http://localhost:81/users');
    expect(response.users[0].username).toBe('bob');
  });

  it('normalizes wrapped active account responses when selecting an account', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        active_account: {
          id: 'acc_2',
          username: 'publisher',
          platforms: ['tiktok'],
        },
      },
    } as any);

    const account = await ExternalAPI.setActiveAccount('acc_2');

    expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:81/v1/accounts/active', {
      account_id: 'acc_2',
    });
    expect(account).toEqual(
      expect.objectContaining({
        _id: 'acc_2',
        username: 'publisher',
        platforms: ['tiktok'],
      })
    );
  });
});
