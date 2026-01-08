import React from 'react';
import { clipStyles, getStyleIds } from '../../clipStyles';

interface ClipStyleSelectorProps {
  value: string;
  onChange: (style: string) => void;
  className?: string;
}

const ClipStyleSelector: React.FC<ClipStyleSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const styleIds = getStyleIds();

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-sm text-slate-400">Clip Style</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
      >
        {styleIds.map((id) => (
          <option key={id} value={id}>
            {clipStyles[id].name}
          </option>
        ))}
      </select>
      <span className="text-xs text-slate-500">
        {clipStyles[value]?.description}
      </span>
    </div>
  );
};

export default ClipStyleSelector;