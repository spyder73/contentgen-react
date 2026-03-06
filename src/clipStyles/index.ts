import { standardStyle } from './standard';
import { medievalStyle } from './medieval';
import { genericCarouselStyle } from './genericCarousel';
import { ClipStyleConfig, MetadataFieldConfig } from './types';

export type { MetadataFieldConfig };

export const clipStyles: Record<string, ClipStyleConfig> = {
  standard: standardStyle,
  medieval: medievalStyle,
  genericCarousel: genericCarouselStyle,
};

export function getStyleConfig(styleId: string): ClipStyleConfig {
  return clipStyles[styleId] || standardStyle;
}

export function getAllStyles(): ClipStyleConfig[] {
  return Object.values(clipStyles);
}

export function getStyleIds(): string[] {
  return Object.keys(clipStyles);
}