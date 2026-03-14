import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ModelSettingsModal from '../ModelSettingsModal';

describe('ModelSettingsModal', () => {
  it('converts dimensions selections into numeric width and height on save', () => {
    const onSettingsChange = jest.fn();

    render(
      <ModelSettingsModal
        isOpen
        onClose={() => undefined}
        modelId="google:4@1"
        modality="image"
        settings={{}}
        onSettingsChange={onSettingsChange}
        constraints={{
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
        }}
      />
    );

    fireEvent.change(screen.getByDisplayValue('1024x1024'), {
      target: { value: '768x1344' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onSettingsChange).toHaveBeenCalledWith({
      width: 768,
      height: 1344,
      steps: 28,
    });
  });
});
