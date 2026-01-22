import React from 'react';
import { constructMediaUrl } from '../../../api/helpers';
import NavigationControls from './NavigationControls';

interface ImageComparisonProps {
  originalImages: { id: string; file_url: string }[];
  outputUrls: string[];
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
}

const ImageComparison: React.FC<ImageComparisonProps> = ({
  originalImages,
  outputUrls,
  currentIndex,
  setCurrentIndex,
}) => (
  <div>
    <p className="text-slate-400 text-sm font-medium mb-2">
      🔄 Before / After ({currentIndex + 1}/{outputUrls.length})
    </p>
    <div className="grid grid-cols-2 gap-2">
      <div className="relative aspect-[4/5] bg-black rounded-lg overflow-hidden">
        <span className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs text-slate-300 z-10">
          Original
        </span>
        <img
          src={constructMediaUrl(originalImages[currentIndex]?.file_url)}
          alt="Original"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="relative aspect-[4/5] bg-black rounded-lg overflow-hidden">
        <span className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs text-slate-300 z-10">
          Output
        </span>
        <img
          src={constructMediaUrl(outputUrls[currentIndex])}
          alt="Output"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
    {outputUrls.length > 1 && (
      <NavigationControls
        currentIndex={currentIndex}
        total={outputUrls.length}
        onPrev={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
        onNext={() => setCurrentIndex(Math.min(outputUrls.length - 1, currentIndex + 1))}
      />
    )}
  </div>
);

export default ImageComparison;