import React, { useRef, useState } from 'react';

interface ClipPlayerProps {
  clipUrl: string;
  onClose?: () => void;
  cacheBuster?: number;
}

const ClipPlayer: React.FC<ClipPlayerProps> = ({ clipUrl, onClose, cacheBuster }) => {
  const clipRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const clipSrc = cacheBuster ? `${clipUrl}?t=${cacheBuster}` : clipUrl;

  const togglePlay = () => {
    const clip = clipRef.current;
    if (!clip) return;

    if (clip.paused) {
      clip.play();
      setIsPlaying(true);
    } else {
      clip.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const clip = clipRef.current;
    if (!clip || !clip.duration) return;
    setProgress((clip.currentTime / clip.duration) * 100);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const clip = clipRef.current;
    if (!clip) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    clip.currentTime = position * clip.duration;
  };

  // Modal version
  if (onClose) {
    return (
      <div 
        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div 
          className="relative max-h-[90vh] max-w-[90vw]"
          onClick={(e) => e.stopPropagation()}
          style={{ aspectRatio: '9/16' }}
        >
          <video
            ref={clipRef}
            src={clipSrc}
            className="h-full w-full object-contain rounded-xl"
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
          />

          {!isPlaying && (
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={togglePlay}
            >
              <span className="text-white text-8xl opacity-80 hover:opacity-100">
                ▶️
              </span>
            </div>
          )}

          <div 
            className="absolute bottom-4 left-4 right-4 h-2 bg-gray-600 rounded cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-blue-500 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Inline version
  return (
    <div className="relative aspect-[9/16] max-h-[400px] bg-black rounded-lg overflow-hidden">
      <video
        ref={clipRef}
        src={clipSrc}
        muted
        className="h-full w-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <span className="text-white text-6xl opacity-80 hover:opacity-100">
            ▶️
          </span>
        </div>
      )}

      <div 
        className="absolute bottom-2 left-2 right-2 h-1.5 bg-gray-600 rounded cursor-pointer"
        onClick={handleProgressClick}
      >
        <div 
          className="h-full bg-blue-500 rounded"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ClipPlayer;