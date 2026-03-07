import React from 'react';
import { ClipStyleSummary } from '../../api/clipstyleSchema';

interface ClipStyleSelectorProps {
  value: string;
  onChange: (style: string) => void;
  styles: ClipStyleSummary[];
  isLoading?: boolean;
  className?: string;
}

const ClipStyleSelector: React.FC<ClipStyleSelectorProps> = ({
  value,
  onChange,
  styles,
  isLoading = false,
  className = '',
}) => {
  const selectedStyle = styles.find((style) => style.id === value);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-sm text-muted">Clip Style</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading || styles.length === 0}
        className="w-full select"
      >
        {isLoading && <option value={value}>Loading styles...</option>}
        {!isLoading && styles.length === 0 && <option value={value}>{value || 'No styles available'}</option>}
        {!isLoading &&
          styles.map((style) => (
            <option key={style.id} value={style.id}>
              {style.name}
            </option>
          ))}
      </select>
      <span className="text-xs text-muted">{selectedStyle?.description || ''}</span>
    </div>
  );
};

export default ClipStyleSelector;
