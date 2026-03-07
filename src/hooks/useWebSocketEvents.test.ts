import { buildRunUpdateToast } from './useWebSocketEvents';

describe('buildRunUpdateToast', () => {
  it('returns info toast for canonical run_update event payloads', () => {
    const toast = buildRunUpdateToast({
      type: 'run_update',
      status: 'running',
      message: 'worker picked up run',
      event_type: 'run.started',
    });

    expect(toast).toEqual({
      text: 'worker picked up run',
      level: 'info',
    });
  });

  it('returns success toast for completed scheduler run updates', () => {
    const toast = buildRunUpdateToast({
      data: {
        type: 'scheduler',
        status: 'completed',
        message: 'Clip scheduled for 2026-03-08',
      },
    });

    expect(toast).toEqual({
      text: 'Clip scheduled for 2026-03-08',
      level: 'success',
    });
  });

  it('returns info toast for queued scheduling updates', () => {
    const toast = buildRunUpdateToast({
      run_type: 'schedule',
      status: 'queued',
    });

    expect(toast).toEqual({
      text: 'Scheduling run in progress...',
      level: 'info',
    });
  });

  it('returns error toast for failed scheduling updates', () => {
    const toast = buildRunUpdateToast({
      domain: 'scheduler',
      run_status: 'failed',
      error: 'Missing account credentials',
    });

    expect(toast).toEqual({
      text: 'Missing account credentials',
      level: 'error',
    });
  });

  it('returns null for non-scheduler run updates', () => {
    const toast = buildRunUpdateToast({
      type: 'pipeline',
      status: 'running',
      message: 'Checkpoint 2/4',
    });

    expect(toast).toBeNull();
  });
});
