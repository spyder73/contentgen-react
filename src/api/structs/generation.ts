// LEGACY FILE — migrating to MediaOutputSpec / MediaProfile from media-spec.ts
// These aliases exist only so existing component imports don't break during migration.
// TODO: remove this file once all call sites are migrated.

import { MediaOutputSpec, MediaProfile } from './media-spec';

/** @deprecated Use MediaOutputSpec */
export type ImageGenerationSettings = Partial<MediaOutputSpec>;

/** @deprecated Use MediaOutputSpec */
export type VideoGenerationSettings = Partial<MediaOutputSpec>;

/** @deprecated Use MediaOutputSpec */
export type AudioGenerationSettings = Partial<MediaOutputSpec>;

/** @deprecated Use MediaProfile */
export type GenerationConfigPayload = MediaProfile;

/** @deprecated Build MediaProfile directly */
export function compactGenerationConfig(config: MediaProfile): MediaProfile {
  const out: MediaProfile = {};
  if (config.image?.provider && config.image?.model) out.image = config.image;
  if (config.video?.provider && config.video?.model) out.video = config.video;
  if (config.audio?.provider && config.audio?.model) out.audio = config.audio;
  return out;
}
