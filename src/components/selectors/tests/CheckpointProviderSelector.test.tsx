import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ModelsAPI from '../../../api/models';
import CheckpointProviderSelector from '../CheckpointProviderSelector';

jest.mock('../../../api/models');

const mockedModelsApi = ModelsAPI as jest.Mocked<typeof ModelsAPI>;

describe('CheckpointProviderSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedModelsApi.getChatModels.mockResolvedValue([
      {
        id: 'x-ai/grok-4-fast',
        name: 'Grok 4 Fast',
        type: 'chat',
        provider: 'openrouter',
      } as any,
    ]);
  });

  it('keeps the model dropdown trigger bounded to the container width', async () => {
    render(
      <CheckpointProviderSelector
        provider="openrouter"
        model=""
        modality="chat"
        onProviderChange={() => undefined}
        onModelChange={() => undefined}
        modelAriaLabel="Chat model"
      />
    );

    const trigger = await screen.findByRole('button', { name: 'Chat model' });
    expect(trigger.className).toContain('w-full');
    expect(trigger.className).toContain('min-w-0');

    fireEvent.click(trigger);

    await waitFor(() => {
      const menu = trigger.parentElement?.querySelector('.dropdown');
      expect(menu?.className).toContain('max-w-full');
      expect(menu?.className).toContain('w-full');
    });
  });

  it('renders a manual model input for audio selectors when requested', () => {
    render(
      <CheckpointProviderSelector
        provider="suno"
        model="chirp-v1"
        modality="audio"
        allowManualModelInput
        onProviderChange={() => undefined}
        onModelChange={() => undefined}
        modelAriaLabel="Audio model"
      />
    );

    expect(screen.getByLabelText('Audio model')).toHaveValue('chirp-v1');
  });

  it('keeps reference-image-compatible models available for image_to_image selection', async () => {
    mockedModelsApi.getImageModels.mockResolvedValue([
      {
        id: 'google:4@3',
        name: 'Nano Banana Edit',
        type: 'image',
        provider: 'runware',
      } as any,
    ]);
    mockedModelsApi.getModelConstraints.mockResolvedValue({
      capabilities: {
        supports_seed_image: false,
        supports_reference_images: true,
      },
    } as any);

    render(
      <CheckpointProviderSelector
        provider="runware"
        model=""
        modality="image"
        requireSeedImageSupport
        onProviderChange={() => undefined}
        onModelChange={() => undefined}
        modelAriaLabel="Image model"
      />
    );

    expect(await screen.findByRole('button', { name: 'Image model' })).toBeInTheDocument();
    await waitFor(() => {
      expect(mockedModelsApi.getModelConstraints).toHaveBeenCalledWith('google:4@3', 'image');
    });
  });
});
