import React, { useRef, useState, useEffect } from 'react';
import { constructImageUrl } from '../api/api';

interface VideoPlayerProps {
  fileUrl: string;
  onClose: () => void;
  cacheBuster?: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ fileUrl, onClose, cacheBuster }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset state when URL or cacheBuster changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
    setProgress(0);
  }, [fileUrl, cacheBuster]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(progress);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = clickPosition * videoRef.current.duration;
  };

  const videoSrc = constructImageUrl(fileUrl, cacheBuster);

  if (hasError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-slate-800 p-8 rounded-lg text-center">
          <span className="text-6xl">⏳</span>
          <p className="text-white mt-4">Video is still being generated...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
        style={{ aspectRatio: '9/16' }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        
        <video
          ref={videoRef}
          key={videoSrc} // Force re-mount when URL changes
          src={videoSrc}
          className="h-full w-full object-contain rounded-xl"
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlayPause}
          onLoadedData={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />

        {/* Play/Pause Overlay */}
        {!isPlaying && !isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={togglePlayPause}
          >
            <span className="text-white text-8xl opacity-80 hover:opacity-100 transition-opacity">
              ▶️
            </span>
          </div>
        )}

        {/* Progress Bar */}
        <div 
          className="absolute bottom-4 left-4 right-4 h-2 bg-gray-600 rounded cursor-pointer"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-red-600 rounded transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;