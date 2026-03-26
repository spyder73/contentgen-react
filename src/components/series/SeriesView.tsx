import React, { useState, useCallback } from 'react';
import { Series } from '../../api/series';
import { useSeriesData } from '../../hooks/useSeriesData';
import SeriesList from './SeriesList';
import SeriesPage from './SeriesPage';

const SeriesView: React.FC = () => {
  const { series, loading, error, refresh } = useSeriesData();
  const [currentSeries, setCurrentSeries] = useState<Series | null>(null);

  const handleSelect = useCallback((s: Series) => setCurrentSeries(s), []);

  const handleCreated = useCallback((s: Series) => {
    refresh();
    setCurrentSeries(s);
  }, [refresh]);

  const handleSeriesUpdated = useCallback((updated: Series) => {
    setCurrentSeries(updated);
    refresh();
  }, [refresh]);

  if (currentSeries) {
    return (
      <SeriesPage
        series={currentSeries}
        onBack={() => setCurrentSeries(null)}
        onSeriesUpdated={handleSeriesUpdated}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xs text-slate-500 uppercase tracking-wider">Series</h2>
      <SeriesList
        series={series}
        loading={loading}
        error={error}
        onSelect={handleSelect}
        onCreated={handleCreated}
      />
    </div>
  );
};

export default SeriesView;
