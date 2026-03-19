import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import IdeaGeneratorPanel from '../IdeaGeneratorPanel';
import { usePipelineRuns } from '../../../hooks/usePipelineRuns';
import PipelineAPI from '../../../api/pipeline';
import ClipAPI from '../../../api/clip';
import { PipelineRun, PipelineTemplate } from '../../../api/structs';

jest.mock('../../../hooks/usePipelineRuns');
jest.mock('../../../api/pipeline');
jest.mock('../../../api/clip');
jest.mock('../PipelineRunItem', () => (props: { run: PipelineRun }) => (
  <div data-testid={`run-item-${props.run.id}`}>{props.run.status}</div>
));
jest.mock('../IdeaInputForm', () => (props: { workspaceResetSignal?: number }) => (
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

const outputWithSceneMapping = JSON.stringify({
  name: 'Clip One',
  imagePrompts: [
    {
      prompt: 'Poster frame',
      outputSpec: { provider: 'runware', model: 'image-1' },
    },
  ],
  aiVideoPrompts: [
    {
      prompt: 'Main sequence a',
      outputSpec: { provider: 'runware', model: 'video-1' },
    },
    {
      prompt: 'Main sequence b',
      outputSpec: { provider: 'runware', model: 'video-1' },
    },
  ],
  metadata: {
    scene_reference_mapping: [
      {
        scene_id: 'scene-b',
        order: 2,
        required_reference: true,
      },
      {
        scene_id: 'scene-a',
        order: 1,
        required_reference: true,
        reference_media_id: 'generated-1',
      },
    ],
    reference_assets: [
      {
        id: 'generated-1',
        media_id: 'generated-1',
        type: 'image',
        name: 'Generated Frame',
        source: 'generated',
      },
    ],
  },
});

describe('IdeaGeneratorPanel explicit clip assembly', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    removeRunMock = jest.fn();

    mockedPipelineApi.listPipelineTemplates.mockResolvedValue([template]);
    mockedPipelineApi.getPipelineOutput.mockResolvedValue({
      status: 'completed',
      ready: true,
      output: outputWithSceneMapping,
    });

    mockedClipApi.getAvailableMedia.mockResolvedValue([
      {
        id: 'library-image-1',
        media_id: 'library-image-1',
        type: 'image',
        name: 'Library Hero',
        url: 'https://cdn.example.com/library-hero.png',
        source: 'media_library',
      },
      {
        id: 'library-image-2',
        media_id: 'library-image-2',
        type: 'image',
        name: 'Library Product',
        url: 'https://cdn.example.com/library-product.png',
        source: 'media_library',
      },
    ]);
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

  it('renders scene rows in stable order and blocks assemble when required references are missing', async () => {
    render(
      <IdeaGeneratorPanel
        onIdeasCreated={() => undefined}
        onClipsCreated={() => undefined}
      />
    );

    await screen.findByTestId('scene-row-scene-a-1');

    expect(mockedClipApi.createClipPromptFromJson).not.toHaveBeenCalled();
    expect(screen.getByText('1 unresolved')).toBeInTheDocument();

    const sceneRows = screen.getAllByTestId(/scene-row-/);
    expect(sceneRows).toHaveLength(2);
    expect(sceneRows[0]).toHaveTextContent('Scene 1: scene-a');
    expect(sceneRows[1]).toHaveTextContent('Scene 2: scene-b');
    expect(screen.getByTestId('scene-reference-preview-scene-a-1')).toBeInTheDocument();
    expect(screen.getByTestId('scene-reference-preview-scene-b-2')).toBeInTheDocument();
    expect(screen.getByTestId('scene-row-scene-b-2')).toHaveTextContent('No reference');

    const assembleButton = screen.getByRole('button', { name: 'Assemble Clip Prompt' });
    expect(assembleButton).toBeDisabled();
  });

  it('supports manual scene override and serializes per-scene metadata on explicit assembly', async () => {
    const onClipsCreated = jest.fn();

    render(
      <IdeaGeneratorPanel
        onIdeasCreated={() => undefined}
        onClipsCreated={onClipsCreated}
      />
    );

    await screen.findByTestId('scene-row-scene-b-2');

    fireEvent.change(screen.getByLabelText('Scene scene-b reference'), {
      target: { value: 'library-image-2' },
    });
    fireEvent.change(screen.getByLabelText('Scene scene-a reference'), {
      target: { value: 'library-image-1' },
    });

    const assembleButton = screen.getByRole('button', { name: 'Assemble Clip Prompt' });
    expect(assembleButton).toBeEnabled();

    fireEvent.click(assembleButton);

    await waitFor(() => {
      expect(mockedClipApi.createClipPromptFromJson).toHaveBeenCalledTimes(1);
    });

    const [payloadJson] = mockedClipApi.createClipPromptFromJson.mock.calls[0];
    const payload = JSON.parse(payloadJson as string);

    expect(payload.music_media_id).toBeUndefined();
    expect(payload.metadata.music_media_id).toBeUndefined();
    expect(payload.metadata.scene_reference_mapping).toEqual([
      expect.objectContaining({ scene_id: 'scene-a', order: 1, reference_media_id: 'library-image-1' }),
      expect.objectContaining({ scene_id: 'scene-b', order: 2, reference_media_id: 'library-image-2' }),
    ]);
    expect(payload.metadata.reference_assets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ media_id: 'generated-1' }),
        expect.objectContaining({ media_id: 'library-image-1' }),
        expect.objectContaining({ media_id: 'library-image-2' }),
      ])
    );
    expect(payload.imagePrompts[0].metadata.reference_image_url).toBe('https://cdn.example.com/library-hero.png');
    expect(payload.imagePrompts[0].outputSpec.referenceImages).toBeUndefined();
    expect(payload.aiVideoPrompts[0].metadata.reference_image_url).toBe('https://cdn.example.com/library-hero.png');
    expect(payload.aiVideoPrompts[1].metadata.reference_image_url).toBe('https://cdn.example.com/library-product.png');
    expect(payload.aiVideoPrompts[0].outputSpec.referenceImages).toBeUndefined();
    expect(payload.aiVideoPrompts[1].outputSpec.referenceImages).toBeUndefined();

    await waitFor(() => {
      expect(onClipsCreated).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByText('Output JSON Preview'));
    expect(screen.getByTestId('json-preview-run-1:0')).toHaveTextContent(
      '"reference_image_url": "https://cdn.example.com/library-hero.png"'
    );

    expect(screen.getByText('Assembled')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close Run Workspace' })).toBeInTheDocument();
  });

  it('applies backend missing-reference feedback per scene and keeps progression blocked', async () => {
    mockedClipApi.createClipPromptFromJson.mockRejectedValue({
      response: {
        data: {
          message: 'Missing required references',
          unresolved_count: 1,
          missing_required_references: [
            {
              scene_id: 'scene-b',
              order: 2,
              message: 'Select a valid reference asset for scene-b.',
            },
          ],
        },
      },
    });

    render(
      <IdeaGeneratorPanel
        onIdeasCreated={() => undefined}
        onClipsCreated={() => undefined}
      />
    );

    await screen.findByTestId('scene-row-scene-b-2');

    fireEvent.change(screen.getByLabelText('Scene scene-b reference'), {
      target: { value: 'library-image-1' },
    });

    const assembleButton = screen.getByRole('button', { name: 'Assemble Clip Prompt' });
    expect(assembleButton).toBeEnabled();

    fireEvent.click(assembleButton);

    await waitFor(() => {
      expect(screen.getByText('1 required scene reference unresolved.')).toBeInTheDocument();
    });

    expect(screen.getByText('Select a valid reference asset for scene-b.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Assemble Clip Prompt' })).toBeDisabled();
  });

});
