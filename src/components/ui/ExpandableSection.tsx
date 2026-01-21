import React, { useState } from 'react';

interface ExpandableSectionProps {
  title: string;
  icon: string;
  badge?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  icon,
  badge,
  defaultExpanded = false,
  children,
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (disabled) return null;

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-white font-medium">{title}</span>
          {badge}
        </div>
        <span className="text-slate-400 text-sm">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>
      
      {isExpanded && (
        <div className="p-4 bg-slate-900/30">
          {children}
        </div>
      )}
    </div>
  );
};

export default ExpandableSection;