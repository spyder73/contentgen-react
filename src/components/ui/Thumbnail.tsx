import React, { useState } from 'react';

interface ThumbnailProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
};

const Thumbnail: React.FC<ThumbnailProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  onClick,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Add cache-busting and size hints for faster loading
  const optimizedSrc = src.includes('?') 
    ? `${src}&thumb=1` 
    : `${src}?thumb=1`;

  return (
    <div 
      className={`${sizeClasses[size]} relative rounded overflow-hidden bg-slate-700 ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Loading skeleton */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-slate-600 animate-pulse flex items-center justify-center">
          <span className="text-slate-500 text-xs">⏳</span>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-slate-700 flex items-center justify-center">
          <span className="text-slate-500 text-xs">❌</span>
        </div>
      )}

      {/* Actual image */}
      <img
        src={optimizedSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
};

export default Thumbnail;