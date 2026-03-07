import { clampToConstraint, settingsToOutputSpec } from './modelSettingsHelpers';

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
});
