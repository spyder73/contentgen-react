import {
  clampToConstraint,
  outputSpecToSettings,
  settingsToOutputSpec,
} from '../modelSettingsHelpers';

describe('modelSettingsHelpers', () => {
  it('snaps integer values to multiplier when provided', () => {
    const value = clampToConstraint(1080, {
      type: 'integer',
      min: 128,
      max: 2048,
      multiplier: 16,
    });

    expect(value).toBe(1072);
    expect(value % 16).toBe(0);
  });

  it('snaps integer values using multiple_of alias', () => {
    const value = clampToConstraint(1080, {
      type: 'integer',
      min: 128,
      max: 2048,
      multiple_of: 16,
    });

    expect(value).toBe(1072);
    expect(value % 16).toBe(0);
  });

  it('converts dimensions into width and height output spec fields', () => {
    const outputSpec = settingsToOutputSpec({
      dimensions: '1088x1920',
      steps: 30,
    });

    expect(outputSpec).toEqual({
      width: 1088,
      height: 1920,
      steps: 30,
    });
  });

  it('hydrates dimensions from saved width and height for modal state', () => {
    const settings = outputSpecToSettings(
      {
        width: 768,
        height: 1344,
        steps: 28,
      },
      {
        model_id: 'google:4@1',
        fields: {
          dimensions: {
            type: 'string',
            enum: ['1024x1024', '768x1344'],
          },
          steps: {
            type: 'integer',
            min: 1,
            max: 50,
          },
        },
      }
    );

    expect(settings).toEqual({
      dimensions: '768x1344',
      steps: 28,
    });
  });
});
