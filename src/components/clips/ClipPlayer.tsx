import React, { useMemo, useRef, useState } from 'react';

interface ClipPlayerProps {
  clipUrl: string;
  onClose?: () => void;
  cacheBuster?: number;
}

const PlayIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    role="presentation"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.28-6.86a1 1 0 0 0 0-1.66L9.54 4.3A1 1 0 0 0 8 5.14z" />
  </svg>
);

const ClipPlayer: React.FC<ClipPlayerProps> = ({ clipUrl, onClose, cacheBuster }) => {
  const clipRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasPlaybackError, setHasPlaybackError] = useState(false);
  const clipSrc = useMemo(
    () => (cacheBuster ? `${clipUrl}${clipUrl.includes('?') ? '&' : '?'}t=${cacheBuster}` : clipUrl),
    [cacheBuster, clipUrl]
  );

  const togglePlay = async () => {
    const clip = clipRef.current;
    if (!clip) return;

    if (clip.paused) {
      try {
        await clip.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Unable to start video playback:', error);
        setHasPlaybackError(true);
        setIsPlaying(false);
      }
      return;
    }

    clip.pause();
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    const clip = clipRef.current;
    if (!clip || !clip.duration || Number.isNaN(clip.duration)) return;
    setProgress((clip.currentTime / clip.duration) * 100);
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const clip = clipRef.current;
    if (!clip || !clip.duration || Number.isNaN(clip.duration)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const position = (event.clientX - rect.left) / rect.width;
    clip.currentTime = Math.max(0, Math.min(1, position)) * clip.duration;
  };

  const handlePlaybackError = () => {
    setHasPlaybackError(true);
    setIsPlaying(false);
  };

  const renderVideoCore = (className: string) => (
    <>
      <video
        ref={clipRef}
        src={clipSrc}
        className={className}
        muted={!onClose}
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onClick={() => void togglePlay()}
        onError={handlePlaybackError}
      />

      {!hasPlaybackError && !isPlaying && (
        <button
          type="button"
          onClick={() => void togglePlay()}
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/70 via-black/20 to-transparent transition hover:bg-black/25"
          aria-label="Play video"
        >
          <span className="h-16 w-16 rounded-full border border-white/40 bg-black/60 text-white shadow-lg flex items-center justify-center">
            <PlayIcon className="h-8 w-8 ml-1" />
          </span>
        </button>
      )}

      {!hasPlaybackError && (
        <div
          className="absolute bottom-2 left-2 right-2 h-1.5 bg-black/60 rounded-full cursor-pointer border border-white/20"
          onClick={handleProgressClick}
          role="slider"
          aria-label="Video progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className="h-full bg-cyan-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {hasPlaybackError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/85 p-4">
          <div className="max-w-sm text-center space-y-2">
            <p className="text-sm text-zinc-200 uppercase tracking-wide">Video preview unavailable</p>
            <p className="text-xs text-zinc-400">
              This browser could not render the preview stream. Open the file directly to verify playback.
            </p>
            <a
              href={clipSrc}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded border border-white/25 px-3 py-1.5 text-xs text-zinc-100 hover:bg-white/10"
            >
              Open Source File
            </a>
          </div>
        </div>
      )}
    </>
  );

  if (onClose) {
    return (
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="relative max-h-[90vh] max-w-[90vw] rounded-xl border border-white/20 bg-black/75 overflow-hidden"
          onClick={(event) => event.stopPropagation()}
          style={{ aspectRatio: '9/16' }}
        >
          {renderVideoCore('h-full w-full object-contain')}
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[9/16] max-h-[460px] rounded-xl overflow-hidden border border-white/15 bg-black/70">
      {renderVideoCore('h-full w-full object-contain')}
    </div>
  );
};

export default ClipPlayer;
