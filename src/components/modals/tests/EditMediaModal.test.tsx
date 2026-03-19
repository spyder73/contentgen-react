import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EditMediaModal from '../EditMediaModal';
import API from '../../../api/api';
import ModelsAPI from '../../../api/models';
import { MediaItem } from '../../../api/structs/media';

jest.mock('../../../api/api', () => ({
  __esModule: true,
  default: {
    editMediaItem: jest.fn(),
    replaceMediaMetadata: jest.fn(),
    getAvailableMedia: jest.fn(),
  },
}));
jest.mock('../../../api/models', () => ({
  __esModule: true,
  default: {
    getImageModels: jest.fn(),
    getVideoModels: jest.fn(),
    getChatModels: jest.fn(),
    getModelConstraints: jest.fn(),
  },
}));

const mockedApi = API as jest.Mocked<typeof API>;
const mockedModelsApi = ModelsAPI as jest.Mocked<typeof ModelsAPI>;

const mediaItem: MediaItem = {
  id: 'media-1',
  type: 'image',
  prompt: 'Original prompt',
  file_url: 'https://cdn.example.com/original.png',
  metadata: {
    caption: 'Base metadata',
  },
};

describe('EditMediaModal replacement references', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.editMediaItem.mockResolvedValue({});
    mockedApi.replaceMediaMetadata.mockResolvedValue({});
    mockedModelsApi.getImageModels.mockResolvedValue([
      {
        id: 'runware:image-v2',
        name: 'Runware Image v2',
        provider: 'runware',
        type: 'image',
      },
    ] as any);
    mockedApi.getAvailableMedia.mockResolvedValue([
      {
        id: 'media-replace-1',
        type: 'image',
        name: 'Replacement Image',
        url: 'https://cdn.example.com/replacement.png',
        mime_type: 'image/png',
      },
    ]);
  });

  it('submits selected replacement media references as additive metadata keys', async () => {
    render(
      <EditMediaModal
        isOpen={true}
        onClose={() => undefined}
        item={mediaItem}
        onSuccess={() => undefined}
      />
    );

    await waitFor(() => {
      expect(mockedApi.getAvailableMedia).toHaveBeenCalledTimes(1);
    });

    const replacementSelect = screen.getByLabelText('Replacement Asset');
    await waitFor(() => expect(replacementSelect).not.toBeDisabled());

    fireEvent.change(replacementSelect, {
      target: { value: 'media-replace-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockedApi.replaceMediaMetadata).toHaveBeenCalledWith(
        'media-1',
        expect.objectContaining({
          replacement_media_id: 'media-replace-1',
          replacementMediaId: 'media-replace-1',
          media_item_ref: { media_id: 'media-replace-1' },
        })
      );
    });

    expect(mockedApi.editMediaItem.mock.invocationCallOrder[0]).toBeLessThan(
      mockedApi.replaceMediaMetadata.mock.invocationCallOrder[0]
    );
  });

  it('clears replacement keys when replacement is removed', async () => {
    const itemWithReplacement: MediaItem = {
      ...mediaItem,
      metadata: {
        ...mediaItem.metadata,
        replacement_media_id: 'media-old',
        replacementMediaId: 'media-old',
        media_item_ref: { media_id: 'media-old' },
      },
    };

    render(
      <EditMediaModal
        isOpen={true}
        onClose={() => undefined}
        item={itemWithReplacement}
        onSuccess={() => undefined}
      />
    );

    await waitFor(() => {
      expect(mockedApi.getAvailableMedia).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => expect(screen.getByLabelText('Replacement Asset')).not.toBeDisabled());

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockedApi.replaceMediaMetadata).toHaveBeenCalledTimes(1);
    });

    const metadataPayload = mockedApi.replaceMediaMetadata.mock.calls[0][1] as Record<string, unknown>;
    expect(metadataPayload).not.toHaveProperty('replacement_media_id');
    expect(metadataPayload).not.toHaveProperty('replacementMediaId');
    expect(metadataPayload).not.toHaveProperty('media_item_ref');
  });

  it('allows clearing provider/model to inherit clip defaults on save', async () => {
    const itemWithSpec: MediaItem = {
      ...mediaItem,
      output_spec: {
        provider: 'runware',
        model: 'runware:image-v2',
      },
    };

    render(
      <EditMediaModal
        isOpen={true}
        onClose={() => undefined}
        item={itemWithSpec}
        onSuccess={() => undefined}
      />
    );

    await waitFor(() => {
      expect(mockedApi.getAvailableMedia).toHaveBeenCalledTimes(1);
    });

    const [providerSelect] = screen.getAllByRole('combobox');
    fireEvent.change(providerSelect, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockedApi.editMediaItem).toHaveBeenCalledWith(
        'media-1',
        expect.objectContaining({
          output_spec: undefined,
        })
      );
    });
  });
});
