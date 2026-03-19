import {
  createEmptyClipStyleSchema,
  normalizeClipStyleList,
  normalizeClipStyleSchema,
} from '../clipstyleSchema';

describe('clipstyle schema normalization', () => {
  it('normalizes style list from mixed backend payload', () => {
    const result = normalizeClipStyleList({
      styles: [
        { id: 'standard', name: 'Standard', description: 'Default style' },
        { style: 'genericCarousel', display_name: 'Generic Carousel' },
        'medieval',
      ],
    });

    expect(result).toEqual([
      { id: 'standard', name: 'Standard', description: 'Default style' },
      { id: 'genericCarousel', name: 'Generic Carousel', description: '' },
      { id: 'medieval', name: 'Medieval', description: '' },
    ]);
  });

  it('normalizes schema metadata fields and media fields', () => {
    const schema = normalizeClipStyleSchema('standard', {
      schema: {
        name: 'Standard',
        metadata_fields: [
          {
            key: 'frontText',
            label: 'Front Text',
            type: 'textarea',
            description: 'One line per row',
          },
          {
            key: 'POV',
            options: ['0', '1'],
          },
        ],
        media_metadata_fields: {
          image: [{ key: 'text', label: 'Overlay Text' }],
          video: [{ key: 'duration', type: 'number' }],
        },
      },
    });

    expect(schema.id).toBe('standard');
    expect(schema.name).toBe('Standard');
    expect(schema.metadataFields).toHaveLength(2);
    expect(schema.metadataFields[0].type).toBe('textarea');
    expect(schema.metadataFields[1].type).toBe('select');
    expect(schema.mediaMetadataFields.image).toHaveLength(1);
    expect(schema.mediaMetadataFields.ai_video).toHaveLength(1);
    expect(schema.mediaMetadataFields.audio).toEqual([]);
  });

  it('normalizes JSON Schema properties + required metadata fields', () => {
    const schema = normalizeClipStyleSchema('story', {
      schema: {
        properties: {
          frontText: {
            title: 'Front Text',
            type: 'array',
            items: { type: 'string' },
            description: 'One line per item',
          },
          partTwo: {
            title: 'Part Two',
            type: 'boolean',
          },
        },
        required: ['frontText'],
      },
    });

    expect(schema.metadataFields).toEqual([
      expect.objectContaining({
        key: 'frontText',
        type: 'textarea',
        required: true,
      }),
      expect.objectContaining({
        key: 'partTwo',
        type: 'checkbox',
        required: false,
      }),
    ]);
  });

  it('merges clip_metadata_fields with JSON Schema properties', () => {
    const schema = normalizeClipStyleSchema('story', {
      schema: {
        clip_metadata_fields: [{ key: 'frontText', type: 'textarea' }],
        properties: {
          partTwo: {
            title: 'Part Two',
            type: 'boolean',
          },
        },
      },
    });

    expect(schema.metadataFields.map((field) => field.key)).toEqual([
      'frontText',
      'partTwo',
    ]);
  });

  it('builds a stable empty schema fallback', () => {
    const schema = createEmptyClipStyleSchema('standard', {
      id: 'standard',
      name: 'Standard',
      description: 'Default style',
    });

    expect(schema).toEqual({
      id: 'standard',
      name: 'Standard',
      description: 'Default style',
      metadataFields: [],
      mediaMetadataFields: {
        image: [],
        ai_video: [],
        audio: [],
      },
    });
  });
});
