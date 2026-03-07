import React, { useState } from 'react';
import { constructMediaUrl } from '../../api/helpers';
import { getFileType } from '../../api/structs/clip';
import { ImageGallery, ImageComparison, VideoGallery } from './output';
import ClipPlayer from './ClipPlayer';

interface OutputGalleryProps {
  fileUrls: string[];
  clipStyle: string;
  originalImages?: { id: string; file_url: string }[];
}

const OutputGallery: React.FC<OutputGalleryProps> = ({
  fileUrls,
  clipStyle,
  originalImages = [],
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Early return if no files
  if (!fileUrls || fileUrls.length === 0) {
    return null;
  }

  const primaryType = getFileType(fileUrls[0]);

  const showComparison =
    primaryType === 'image' &&
    originalImages.length > 0 &&
    fileUrls.length === originalImages.length;

  // Single video - use ClipPlayer
  if (primaryType === 'video' && fileUrls.length === 1) {
    return (
      <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
        <p className="text-slate-400 text-sm font-medium mb-2">Rendered Video</p>
        <ClipPlayer clipUrl={constructMediaUrl(fileUrls[0])} />
      </div>
    );
  }

  // Multiple videos
  if (primaryType === 'video') {
    return (
      <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
        <VideoGallery
          urls={fileUrls}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
        />
      </div>
    );
  }

  // Images with comparison mode
  if (showComparison) {
    return (
      <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
        <ImageComparison
          originalImages={originalImages}
          outputUrls={fileUrls}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
        />
      </div>
    );
  }

  // Images gallery (no comparison)
  if (primaryType === 'image') {
    return (
      <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
        <ImageGallery
          urls={fileUrls}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
        />
      </div>
    );
  }

  // Unknown file types are ignored until backend returns real output media files.
  return null;
};

export default OutputGallery;
