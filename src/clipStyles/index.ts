import { ClipStyleConfig } from './types';
import { standardStyle } from './standard';
import { genericCarousel } from './genericCarousel'

export * from './types';

// Registry of all styles
export const clipStyles: Record<string, ClipStyleConfig> = {
  standard: standardStyle,
  genericCarousel: genericCarousel,
};

// Get all style IDs
export const getStyleIds = (): string[] => Object.keys(clipStyles);

// Get a style config by ID
export const getStyleConfig = (styleId: string): ClipStyleConfig => {
  return clipStyles[styleId] || clipStyles.standard;
};