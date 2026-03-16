import React, { useEffect, useMemo, useState } from 'react';
import { constructMediaUrl } from '../../api/helpers';
import { getFileType, isTransientOutputUrl } from '../../api/structs/clip';
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
  const stableUrls = useMemo(() => {
    const seen = new Set<string>();
    return (fileUrls || [])
      .map((url) => (url || '').trim())
      .filter((url) => {
        if (!url) return false;
        if (isTransientOutputUrl(url)) return false;
        if (seen.has(url)) return false;
        seen.add(url);
        return true;
      });
  }, [fileUrls]);

  const inferredPrimaryType =
    stableUrls.map((url) => getFileType(url)).find((type) => type !== 'unknown') || 'unknown';
  const primaryType = inferredPrimaryType;
  const normalizedUrls =
    primaryType === 'unknown'
      ? stableUrls
      : stableUrls.filter((url) => {
          const type = getFileType(url);
          return type === primaryType || type === 'unknown';
        });
  const safeUrls = normalizedUrls.length > 0 ? normalizedUrls : stableUrls;

  useEffect(() => {
    setCurrentIndex((previous) => {
      if (safeUrls.length === 0) return 0;
      return Math.max(0, Math.min(previous, safeUrls.length - 1));
    });
  }, [safeUrls.length]);

  if (safeUrls.length === 0) {
    return null;
  }

  const showComparison =
    primaryType === 'image' &&
    originalImages.length > 0 &&
    safeUrls.length === originalImages.length;

  const renderSurface = (title: string, content: React.ReactNode) => (
    <div className="mt-4 overflow-hidden rounded-xl border border-white/15 bg-gradient-to-br from-slate-900/80 via-slate-900/55 to-slate-800/70">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
        <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-300">{title}</p>
        <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{clipStyle}</span>
      </div>
      <div className="p-3">{content}</div>
    </div>
  );

  // Single video - use ClipPlayer
  if (primaryType === 'video' && safeUrls.length === 1) {
    return renderSurface('Rendered Video', <ClipPlayer clipUrl={constructMediaUrl(safeUrls[0])} />);
  }

  // Multiple videos
  if (primaryType === 'video') {
    return renderSurface(
      'Rendered Videos',
      <VideoGallery
        urls={safeUrls}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
      />
    );
  }

  // Images with comparison mode
  if (showComparison) {
    return renderSurface(
      'Output Comparison',
      <ImageComparison
        originalImages={originalImages}
        outputUrls={safeUrls}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
      />
    );
  }

  // Images gallery (no comparison)
  if (primaryType === 'image') {
    return renderSurface(
      'Output Gallery',
      <ImageGallery
        urls={safeUrls}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
      />
    );
  }

  // Unknown file types are ignored until backend returns real output media files.
  return null;
};

export default OutputGallery;
