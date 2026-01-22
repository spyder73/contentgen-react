import React from 'react';
import { Button } from '../../ui';

interface NavigationControlsProps {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
  currentIndex,
  total,
  onPrev,
  onNext,
}) => (
  <div className="flex items-center justify-center gap-4 mt-3">
    <Button
      size="sm"
      variant="ghost"
      onClick={onPrev}
      disabled={currentIndex === 0}
    >
      ← Prev
    </Button>
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i === currentIndex ? 'bg-blue-500' : 'bg-slate-600'
          }`}
        />
      ))}
    </div>
    <Button
      size="sm"
      variant="ghost"
      onClick={onNext}
      disabled={currentIndex === total - 1}
    >
      Next →
    </Button>
  </div>
);

export default NavigationControls;