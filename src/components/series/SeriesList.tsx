import React, { useState } from 'react';
import { Series } from '../../api/series';
import CreateSeriesModal from './CreateSeriesModal';

interface Props {
  series: Series[];
  loading: boolean;
  error: string | null;
  onSelect: (series: Series) => void;
  onCreated: (series: Series) => void;
}

const SeriesList: React.FC<Props> = ({ series, loading, error, onSelect, onCreated }) => {
  const [showCreate, setShowCreate] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        Loading series…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 text-red-400 text-sm">{error}</div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* New Series card */}
        <button
          onClick={() => setShowCreate(true)}
          className="aspect-[4/3] rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-white/40 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="text-xs uppercase tracking-wider">New Series</span>
        </button>

        {series.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="aspect-[4/3] rounded-lg bg-white/5 border border-white/10 overflow-hidden flex flex-col hover:border-white/30 transition-colors text-left"
          >
            <div className="w-full h-2/3 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                <polyline points="17 2 12 7 7 2" />
              </svg>
            </div>
            <div className="flex-1 p-2">
              <p className="text-white text-xs font-medium truncate">{s.name}</p>
              {s.concept && (
                <p className="text-slate-500 text-[10px] line-clamp-2 mt-0.5">{s.concept}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      <CreateSeriesModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(s) => {
          onCreated(s);
          setShowCreate(false);
        }}
      />
    </>
  );
};

export default SeriesList;
