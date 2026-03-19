import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ModelsAPI from '../../../api/models';
import PipelineOutputSettingsModal from '../PipelineOutputSettingsModal';

jest.mock('../../../api/models');

const mockedModelsApi = ModelsAPI as jest.Mocked<typeof ModelsAPI>;

describe('PipelineOutputSettingsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedModelsApi.getImageModels.mockResolvedValue([
      {
        id: 'google:4@1',
        name: 'Google 4.1',
        provider: 'runware',
        type: 'image',
      } as any,
    ]);
    mockedModelsApi.getModelConstraints.mockResolvedValue({
      model_id: 'google:4@1',
      fields: {
        dimensions: {
          type: 'string',
          enum: ['1024x1024', '768x1344'],
          default: '1024x1024',
        },
        steps: {
          type: 'integer',
          min: 1,
          max: 50,
          default: 28,
        },
      },
      capabilities: {},
    });
  });

  it('hydrates saved width and height into dimensions before apply', async () => {
    const onApply = jest.fn();

    render(
      <PipelineOutputSettingsModal
        isOpen
        modality="image"
        provider="runware"
        model="google:4@1"
        settings={{
          width: 768,
          height: 1344,
          steps: 30,
        }}
        onClose={() => undefined}
        onApply={onApply}
      />
    );

    await screen.findByDisplayValue('768x1344');
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith({
        provider: 'runware',
        model: 'google:4@1',
        settings: {
          width: 768,
          height: 1344,
          steps: 30,
        },
      })
    );
  });
});
