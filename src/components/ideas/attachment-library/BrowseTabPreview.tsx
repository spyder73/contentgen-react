import React from 'react';
import { MediaLibraryItem } from '../../../api/media';
import { constructMediaUrl } from '../../../api/helpers';
import { resolveMediaPreviewCandidates } from '../mediaPreview';

interface BrowseTabPreviewProps {
  item: MediaLibraryItem;
  mode: 'row' | 'detail';
}

const basePlaceholder =
  'rounded border border-white/20 bg-black/50 flex items-center justify-center text-[10px] text-zinc-400 uppercase';

const renderNoPreview = (
  folder: string,
  mode: 'row' | 'detail',
  detailMessage = 'No preview URL available for this file.'
) =>
  mode === 'row' ? (
    <div className={`w-11 h-11 ${basePlaceholder}`}>{folder}</div>
  ) : (
    <p className="attachment-meta">{detailMessage}</p>
  );

export const BrowseTabPreview: React.FC<BrowseTabPreviewProps> = ({ item, mode }) => {
  const { folder, image, video, audio, poster } = resolveMediaPreviewCandidates(item);
  const [failedUrlSet, setFailedUrlSet] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    setFailedUrlSet(new Set());
  }, [item.media_id, item.id, mode]);

  const handleCandidateError = (url: string) => {
    setFailedUrlSet((prev) => {
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  };

  const imageUrl = image.find((candidate) => !failedUrlSet.has(candidate)) || '';
  const videoUrl = video.find((candidate) => !failedUrlSet.has(candidate)) || '';
  const audioUrl = audio.find((candidate) => !failedUrlSet.has(candidate)) || '';
  const posterUrl = [...poster, ...image].find((candidate) => !failedUrlSet.has(candidate)) || '';
  const sourceFileUrl = video[0] || item.url || '';
  const resolvedImageUrl = imageUrl ? constructMediaUrl(imageUrl) : '';
  const resolvedVideoUrl = videoUrl ? constructMediaUrl(videoUrl) : '';
  const resolvedAudioUrl = audioUrl ? constructMediaUrl(audioUrl) : '';
  const resolvedPosterUrl = posterUrl ? constructMediaUrl(posterUrl) : '';
  const resolvedSourceFileUrl = sourceFileUrl ? constructMediaUrl(sourceFileUrl) : '';

  if (folder === 'image') {
    if (!imageUrl) return renderNoPreview(folder, mode);
    return (
      <img
        src={resolvedImageUrl}
        alt={item.name || item.media_id || item.id}
        className={
          mode === 'row'
            ? 'w-11 h-11 rounded object-cover border border-white/20'
            : 'w-full max-h-44 object-contain rounded border border-white/15 bg-black/40'
        }
        loading="lazy"
        onError={() => handleCandidateError(imageUrl)}
      />
    );
  }

  if (folder === 'video') {
    if (!videoUrl) {
      if (mode === 'row') {
        if (posterUrl) {
          return (
            <div className="relative w-11 h-11 rounded border border-white/20 overflow-hidden">
              <img
                src={resolvedPosterUrl}
                alt={item.name || item.media_id || item.id}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={() => handleCandidateError(posterUrl)}
              />
              <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[9px] uppercase tracking-wide text-zinc-100 text-center">
                Video
              </span>
            </div>
          );
        }

        return (
          <div className="w-11 h-11 rounded border border-blue-400/40 bg-blue-500/10 flex items-center justify-center text-[9px] uppercase tracking-wide text-blue-200">
            Video
          </div>
        );
      }

      return (
        <div className="space-y-2">
          {posterUrl && (
            <img
              src={resolvedPosterUrl}
              alt={item.name || item.media_id || item.id}
              className="w-full max-h-44 object-contain rounded border border-white/15 bg-black/40"
              loading="lazy"
              onError={() => handleCandidateError(posterUrl)}
            />
          )}
          <p className="attachment-meta">
            Video preview is unavailable for this file in the current browser. Open the file to verify playback.
          </p>
          {resolvedSourceFileUrl && (
            <a
              href={resolvedSourceFileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded border border-white/25 px-2.5 py-1 text-[11px] text-zinc-100 hover:bg-white/10"
            >
              Open Source File
            </a>
          )}
        </div>
      );
    }

    return mode === 'row' ? (
      <div className="relative w-11 h-11 rounded border border-white/20 overflow-hidden bg-black/40">
        {posterUrl ? (
          <img
            src={resolvedPosterUrl}
            alt={item.name || item.media_id || item.id}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => handleCandidateError(posterUrl)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[9px] uppercase tracking-wide text-blue-200 bg-blue-500/10">
            Video
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-[10px] text-white">Play</span>
      </div>
    ) : (
      <video
        src={resolvedVideoUrl}
        className="w-full max-h-44 rounded border border-white/15 bg-black/40"
        controls
        playsInline
        preload="metadata"
        poster={resolvedPosterUrl || undefined}
        onError={() => handleCandidateError(videoUrl)}
      />
    );
  }

  if (folder === 'audio') {
    if (!audioUrl) {
      return renderNoPreview(folder, mode, 'Audio preview is unavailable for this file.');
    }

    return mode === 'row' ? (
      <div className="w-11 h-11 rounded border border-amber-300/30 bg-amber-500/10 flex items-center justify-center text-[10px] text-amber-200 uppercase">
        Audio
      </div>
    ) : (
      <audio
        src={resolvedAudioUrl}
        className="w-full"
        controls
        preload="metadata"
        onError={() => handleCandidateError(audioUrl)}
      />
    );
  }

  return mode === 'row' ? (
    <div className={`w-11 h-11 ${basePlaceholder}`}>{folder}</div>
  ) : (
    <p className="attachment-meta">Preview not supported for this media type.</p>
  );
};
