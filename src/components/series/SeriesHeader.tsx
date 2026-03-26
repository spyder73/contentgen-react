import React, { useState } from 'react';
import { Series, updateSeries } from '../../api/series';

interface Props {
  series: Series;
  onBack: () => void;
  onUpdated: (series: Series) => void;
  onGenerate: () => void;
}

const SeriesHeader: React.FC<Props> = ({ series, onBack, onUpdated, onGenerate }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(series.name);
  const [concept, setConcept] = useState(series.concept);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateSeries(series, { name: name.trim(), concept: concept.trim() });
      onUpdated(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(series.name);
    setConcept(series.concept);
    setEditing(false);
  };

  return (
    <div className="relative rounded-xl overflow-hidden mb-4">
      {/* Cover banner */}
      <div className="w-full h-32 bg-gradient-to-br from-indigo-900/60 to-purple-900/60" />

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-3 left-3 flex items-center gap-1 text-xs text-white/70 hover:text-white bg-black/40 px-2 py-1 rounded transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        All Series
      </button>

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        {editing ? (
          <div className="space-y-1.5">
            <input
              className="input input-sm w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <textarea
              className="input input-sm w-full resize-none text-xs"
              rows={2}
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
            />
            <div className="flex gap-1">
              <button className="btn btn-ghost btn-xs" onClick={handleCancel}>Cancel</button>
              <button className="btn btn-primary btn-xs" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-2">
            <div>
              <h2 className="text-white font-semibold text-base leading-tight">{series.name}</h2>
              {series.concept && (
                <p className="text-white/60 text-xs mt-0.5 line-clamp-2">{series.concept}</p>
              )}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
              <button
                className="btn btn-primary btn-xs"
                onClick={onGenerate}
              >
                + Episode
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeriesHeader;
