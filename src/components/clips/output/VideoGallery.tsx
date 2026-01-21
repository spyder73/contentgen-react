import React from 'react';
import { constructMediaUrl } from '../../../api/helpers';
import ClipPlayer from '../ClipPlayer';
import NavigationControls from './NavigationControls';

interface VideoGalleryProps {
  urls: string[];
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
}

const VideoGallery: React.FC<VideoGalleryProps> = ({
  urls,
  currentIndex,
  setCurrentIndex,
}) => (
  <div>
    <p className="text-slate-400 text-sm font-medium mb-2">
      📹 Videos ({currentIndex + 1}/{urls.length})
    </p>
    <ClipPlayer clipUrl={constructMediaUrl(urls[currentIndex])} />
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

export default VideoGallery;