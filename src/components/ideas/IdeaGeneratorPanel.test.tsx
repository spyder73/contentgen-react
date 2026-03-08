import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import IdeaGeneratorPanel from './IdeaGeneratorPanel';
import { usePipelineRuns } from '../../hooks/usePipelineRuns';
import PipelineAPI from '../../api/pipeline';
import ClipAPI from '../../api/clip';
import { PipelineRun, PipelineTemplate } from '../../api/structs';

jest.mock('../../hooks/usePipelineRuns');
jest.mock('../../api/pipeline');
jest.mock('../../api/clip');
jest.mock('./PipelineRunItem', () => () => <div data-testid="run-item" />);
jest.mock('./IdeaInputForm', () => (props: { workspaceResetSignal?: number }) => (
  <div data-testid="workspace-reset">{props.workspaceResetSignal ?? 0}</div>
));

const mockedUsePipelineRuns = usePipelineRuns as jest.MockedFunction<typeof usePipelineRuns>;
const mockedPipelineApi = PipelineAPI as jest.Mocked<typeof PipelineAPI>;
const mockedClipApi = ClipAPI as jest.Mocked<typeof ClipAPI>;
let removeRunMock: jest.Mock;

const template: PipelineTemplate = {
  id: 'template-1',
  name: 'Template One',
  description: 'desc',
  checkpoints: [
    {
      id: 'draft',
      name: 'Draft',
      prompt_template_id: '',
      input_mapping: {},
      requires_confirm: false,
      allow_regenerate: true,
      allow_attachments: true,
    },
  ],
  version: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const completedRun: PipelineRun = {
  id: 'run-1',
  pipeline_template_id: 'template-1',
  initial_input: 'Create a launch teaser',
  initial_attachments: [
    {
      id: 'media-upload-1',
      media_id: 'media-upload-1',
      type: 'image',
      url: 'https://cdn.example.com/upload.png',
      mime_type: 'image/png',
      name: 'Upload Image',
      created_at: '2026-01-01T00:00:00Z',
      source: 'media',
    },
  ],
  current_checkpoint: 1,
  status: 'completed',
  auto_mode: true,
  music_media_id: 'music-123',
  results: [
    {
      checkpoint_id: 'draft',
      status: 'completed',
      input: 'input',
      output: '{"name":"Clip One"}',
      regenerate_count: 0,
      attachments: [
        {
          id: 'generated-1',
          media_id: 'generated-1',
          type: 'image',
          url: 'https://cdn.example.com/generated.png',
          mime_type: 'image/png',
          name: 'Generated Frame',
          created_at: '2026-01-01T00:00:00Z',
          source: 'generated',
        },
      ],
    },
  ],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('IdeaGeneratorPanel run completion transition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    removeRunMock = jest.fn();
    mockedPipelineApi.listPipelineTemplates.mockResolvedValue([template]);
    mockedPipelineApi.getPipelineOutput.mockResolvedValue({
      status: 'completed',
      ready: true,
      output: '{"name":"Clip One","metadata":{"existing":"yes"}}',
    });
    mockedClipApi.createClipPromptFromJson.mockResolvedValue('clip-1');

    mockedUsePipelineRuns.mockReturnValue({
      runs: [completedRun],
      startRun: jest.fn(),
      continueRun: jest.fn(),
      regenerateCheckpoint: jest.fn(),
      injectCheckpointPrompt: jest.fn(),
      addCheckpointAttachment: jest.fn(),
      cancelRun: jest.fn(),
      removeRun: removeRunMock,
    });
  });

  it('creates clip prompts with attachment provenance and resets run workspace state', async () => {
    const onIdeasCreated = jest.fn();
    const onClipsCreated = jest.fn();
    const mediaProfile = {
      image: { provider: 'runware', model: 'image-1' },
    };

    render(
      <IdeaGeneratorPanel
        chatProvider="openrouter"
        chatModel="gpt-4o-mini"
        mediaProfile={mediaProfile}
        onIdeasCreated={onIdeasCreated}
        onClipsCreated={onClipsCreated}
      />
    );

    await waitFor(() => {
      expect(mockedClipApi.createClipPromptFromJson).toHaveBeenCalledTimes(1);
    });

    const [payloadJson, payloadMediaProfile] = mockedClipApi.createClipPromptFromJson.mock.calls[0];
    expect(payloadMediaProfile).toEqual(mediaProfile);
    const payload = JSON.parse(payloadJson as string);
    expect(payload.music_media_id).toBe('music-123');
    expect(payload.metadata.attachment_provenance).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ media_id: 'media-upload-1', source: 'media' }),
        expect.objectContaining({
          media_id: 'generated-1',
          source: 'generated',
          source_checkpoint_id: 'draft',
        }),
      ])
    );

    await waitFor(() => {
      expect(onClipsCreated).toHaveBeenCalledTimes(1);
    });
    expect(onIdeasCreated).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(removeRunMock).toHaveBeenCalledWith('run-1');
    });
    expect(screen.getByTestId('workspace-reset')).toHaveTextContent('1');
  });
});
