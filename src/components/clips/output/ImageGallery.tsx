import React from 'react';
import { constructMediaUrl } from '../../../api/helpers';
import NavigationControls from './NavigationControls';

interface ImageGalleryProps {
  urls: string[];
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  urls,
  currentIndex,
  setCurrentIndex,
}) => (
  <div>
    <p className="text-slate-400 text-sm font-medium mb-2">
      🖼️ Output Images ({currentIndex + 1}/{urls.length})
    </p>
    <div className="relative aspect-[4/5] max-h-[500px] bg-black rounded-lg overflow-hidden">
      <img
        src={constructMediaUrl(urls[currentIndex])}
        alt={`Output ${currentIndex + 1}`}
        className="w-full h-full object-contain"
        onError={(e) => console.error('Image failed to load:', urls[currentIndex])}
      />
    </div>
    {urls.length > 1 && (
      <NavigationControls
        currentIndex={currentIndex}
        total={urls.length}
        onPrev={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
        onNext={() => setCurrentIndex(Math.min(urls.length - 1, currentIndex + 1))}
      />
    )}
  </div>
);

export default ImageGallery;