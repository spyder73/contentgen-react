import React, { useState, useEffect } from 'react';
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

  // ==================== DEBUG ====================
  useEffect(() => {
    console.log('🎬 OutputGallery mounted');
    console.log('  fileUrls:', fileUrls);
    console.log('  fileUrls.length:', fileUrls.length);
    console.log('  clipStyle:', clipStyle);
    console.log('  originalImages:', originalImages);
    
    if (fileUrls.length > 0) {
      const firstUrl = fileUrls[0];
      const fullUrl = constructMediaUrl(firstUrl);
      console.log('  First file URL (raw):', firstUrl);
      console.log('  First file URL (constructed):', fullUrl);
      console.log('  File type:', getFileType(firstUrl));
    }
  }, [fileUrls, clipStyle, originalImages]);
  // ==================== END DEBUG ====================

  // Early return if no files
  if (!fileUrls || fileUrls.length === 0) {
    console.log('🎬 OutputGallery: No fileUrls, returning null');
    return null;
  }

  const primaryType = getFileType(fileUrls[0]);
  console.log('🎬 OutputGallery: primaryType =', primaryType);

  const showComparison =
    primaryType === 'image' &&
    originalImages.length > 0 &&
    fileUrls.length === originalImages.length;

  // Single video - use ClipPlayer
  if (primaryType === 'video' && fileUrls.length === 1) {
    console.log('🎬 OutputGallery: Rendering single video');
    return (
      <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
        <p className="text-slate-400 text-sm font-medium mb-2">📹 Rendered Video</p>
        <ClipPlayer clipUrl={constructMediaUrl(fileUrls[0])} />
      </div>
    );
  }

  // Multiple videos
  if (primaryType === 'video') {
    console.log('🎬 OutputGallery: Rendering video gallery');
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
    console.log('🎬 OutputGallery: Rendering image comparison');
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
    console.log('🎬 OutputGallery: Rendering image gallery');
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

  // Unknown type - show debug info
  console.log('🎬 OutputGallery: Unknown file type, showing fallback');
  return (
    <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
      <p className="text-slate-400 text-sm font-medium mb-2">📁 Output Files</p>
      <ul className="text-xs text-slate-500 space-y-1">
        {fileUrls.map((url, i) => (
          <li key={i}>
            {i + 1}. {url} ({getFileType(url)})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OutputGallery;