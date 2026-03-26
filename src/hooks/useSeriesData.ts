import { useState, useEffect, useCallback } from 'react';
import {
  Series,
  Character,
  Episode,
  listSeries,
  listCharacters,
  listEpisodes,
} from '../api/series';

export function useSeriesData() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSeries();
      setSeries(data);
    } catch {
      setError('Failed to load series');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  return { series, loading, error, refresh: fetchSeries };
}

export function useSeriesDetails(seriesId: string | null) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!seriesId) {
      setCharacters([]);
      setEpisodes([]);
      return;
    }
    setLoading(true);
    try {
      const [chars, eps] = await Promise.all([
        listCharacters(seriesId),
        listEpisodes(seriesId),
      ]);
      setCharacters(chars);
      setEpisodes(eps);
    } finally {
      setLoading(false);
    }
  }, [seriesId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { characters, episodes, setEpisodes, loading, refresh: fetchDetails };
}
