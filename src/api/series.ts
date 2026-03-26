import axios from 'axios';
import { BASE_URL } from './helpers';

// ==================== Types ====================

export interface Series {
  id: string;
  name: string;
  description: string;
  concept: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  series_id: string;
  name: string;
  description: string;
  voice: string;
  /** UUID FK to media_items */
  reference_image_media_id?: string | null;
  /** metadata holds reference_image_url for display */
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type EpisodeStatus = 'draft' | 'generating' | 'complete' | 'failed';

export interface EpisodeMetadata {
  status?: EpisodeStatus;
  run_id?: string;
  clip_id?: string;
  character_ids?: string[];
  initial_context?: string;
  error?: string;
  [key: string]: unknown;
}

export interface Episode {
  id: string;
  series_id: string;
  episode_number: number;
  title: string;
  synopsis: string;
  prev_episode_summary: string;
  metadata: EpisodeMetadata;
  created_at: string;
  updated_at: string;
}

/** Returns the display URL for a character's reference image */
export function characterImageUrl(char: Character): string | undefined {
  const url = char.metadata?.reference_image_url;
  return typeof url === 'string' && url ? url : undefined;
}

// ==================== Series ====================

export const listSeries = (): Promise<Series[]> =>
  axios.get(`${BASE_URL}/series`).then((r) => {
    const d = r.data;
    return Array.isArray(d) ? d : (d?.items ?? []);
  });

export const getSeries = (id: string): Promise<Series> =>
  axios.get(`${BASE_URL}/series/${id}`).then((r) => r.data);

export const createSeries = (data: { name: string; concept: string; description?: string }): Promise<Series> =>
  axios.post(`${BASE_URL}/series`, {
    name: data.name,
    description: data.description ?? '',
    concept: data.concept,
    metadata: {},
  }).then((r) => r.data);

/** Full-object update — series_id not required by store for series */
export const updateSeries = (
  existing: Series,
  updates: Partial<Pick<Series, 'name' | 'description' | 'concept' | 'metadata'>>
): Promise<Series> =>
  axios.put(`${BASE_URL}/series/${existing.id}`, {
    name: updates.name ?? existing.name,
    description: updates.description ?? existing.description,
    concept: updates.concept ?? existing.concept,
    metadata: updates.metadata ?? existing.metadata,
  }).then((r) => r.data);

export const deleteSeries = (id: string): Promise<void> =>
  axios.delete(`${BASE_URL}/series/${id}`).then(() => undefined);

// ==================== Characters ====================

export const listCharacters = (seriesId: string): Promise<Character[]> =>
  axios.get(`${BASE_URL}/characters`, { params: { series_id: seriesId } }).then((r) => {
    const d = r.data;
    return Array.isArray(d) ? d : (d?.items ?? []);
  });

export const createCharacter = (data: {
  series_id: string;
  name: string;
  description?: string;
  voice?: string;
  reference_image_media_id?: string;
  /** stored in metadata.reference_image_url for display */
  reference_image_url?: string;
}): Promise<Character> =>
  axios.post(`${BASE_URL}/characters`, {
    series_id: data.series_id,
    name: data.name,
    description: data.description ?? '',
    voice: data.voice ?? '',
    reference_image_media_id: data.reference_image_media_id ?? null,
    metadata: { reference_image_url: data.reference_image_url ?? '' },
  }).then((r) => r.data);

/**
 * Update a character. Takes the existing character so required fields
 * (series_id) are always present in the PUT body.
 */
export const updateCharacter = (
  existing: Character,
  updates: {
    name?: string;
    description?: string;
    voice?: string;
    reference_image_media_id?: string | null;
    /** stored in metadata.reference_image_url */
    reference_image_url?: string;
  }
): Promise<Character> =>
  axios.put(`${BASE_URL}/characters/${existing.id}`, {
    series_id: existing.series_id,
    name: updates.name ?? existing.name,
    description: updates.description ?? existing.description,
    voice: updates.voice ?? existing.voice,
    reference_image_media_id:
      'reference_image_media_id' in updates
        ? updates.reference_image_media_id
        : existing.reference_image_media_id,
    metadata: {
      ...existing.metadata,
      ...(updates.reference_image_url !== undefined
        ? { reference_image_url: updates.reference_image_url }
        : {}),
    },
  }).then((r) => r.data);

export const deleteCharacter = (id: string): Promise<void> =>
  axios.delete(`${BASE_URL}/characters/${id}`).then(() => undefined);

// ==================== Episodes ====================

export const listEpisodes = (seriesId: string): Promise<Episode[]> =>
  axios.get(`${BASE_URL}/episodes`, { params: { series_id: seriesId } }).then((r) => {
    const d = r.data;
    return Array.isArray(d) ? d : (d?.items ?? []);
  });

export const createEpisode = (data: {
  series_id: string;
  episode_number: number;
  title?: string;
  synopsis?: string;
  metadata?: EpisodeMetadata;
}): Promise<Episode> =>
  axios.post(`${BASE_URL}/episodes`, {
    series_id: data.series_id,
    episode_number: data.episode_number,
    title: data.title ?? '',
    synopsis: data.synopsis ?? '',
    prev_episode_summary: '',
    metadata: data.metadata ?? {},
  }).then((r) => r.data);

/**
 * Update an episode. Takes the existing episode so required fields
 * (series_id, episode_number) are always present in the PUT body.
 */
export const updateEpisode = (
  existing: Episode,
  updates: Partial<Pick<Episode, 'title' | 'synopsis' | 'prev_episode_summary' | 'episode_number' | 'metadata'>>
): Promise<Episode> =>
  axios.put(`${BASE_URL}/episodes/${existing.id}`, {
    series_id: existing.series_id,
    episode_number: updates.episode_number ?? existing.episode_number,
    title: updates.title ?? existing.title,
    synopsis: updates.synopsis ?? existing.synopsis,
    prev_episode_summary: updates.prev_episode_summary ?? existing.prev_episode_summary,
    metadata: updates.metadata ?? existing.metadata,
  }).then((r) => r.data);

export const deleteEpisode = (id: string): Promise<void> =>
  axios.delete(`${BASE_URL}/episodes/${id}`).then(() => undefined);
