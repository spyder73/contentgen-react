import React from 'react';
import { MediaLibraryItem } from '../../../api/media';
import { constructMediaUrl } from '../../../api/helpers';
import { Button } from '../../ui';
import { resolveMediaPreviewCandidates } from '../mediaPreview';

interface UnmetRow {
  id: string;
  name: string;
  summary: {
    details: Array<{
      requirement: { label: string };
      satisfied: boolean;
      missing_count: number;
    }>;
  };
}

interface RunAttachmentsSectionProps {
  selectedRunMedia: MediaLibraryItem[];
  hasMissingRequiredAssets: boolean;
  unmetRequiredCheckpointRows: UnmetRow[];
  onOpenRunPicker: () => void;
}

const mediaPreview = (item: MediaLibraryItem) => {
  const mediaId = item.media_id || item.id;
  const { folder, image, video, audio } = resolveMediaPreviewCandidates(item);
  const previewImageUrl = image[0] || '';
  const previewVideoUrl = video[0] || '';
  const previewAudioUrl = audio[0] || '';

  if (folder === 'image' && previewImageUrl) {
    return (
      <img
        src={constructMediaUrl(previewImageUrl)}
        alt={item.name || mediaId}
        className="w-10 h-10 rounded object-cover border border-white/20"
        loading="lazy"
      />
    );
  }

  if (folder === 'video' && previewVideoUrl) {
      return (
        <video
          src={constructMediaUrl(previewVideoUrl)}
          className="w-10 h-10 rounded object-cover border border-white/20"
          muted
          playsInline
          preload="metadata"
        />
      );
  }

  return (
    <div className="w-10 h-10 rounded border border-white/20 bg-black/50 flex items-center justify-center text-[10px] text-zinc-400 uppercase">
      {folder === 'audio' && previewAudioUrl ? 'Audio' : 'File'}
    </div>
  );
};

const renderMissingDetails = (row: UnmetRow): string =>
  row.summary.details
    .filter((item) => !item.satisfied)
    .map((item) => `${item.requirement.label} (missing ${item.missing_count})`)
    .join(', ');

const RunAttachmentsSection: React.FC<RunAttachmentsSectionProps> = ({
  selectedRunMedia,
  hasMissingRequiredAssets,
  unmetRequiredCheckpointRows,
  onOpenRunPicker,
}) => {
  return (
    <div className={`attachment-surface space-y-3 ${hasMissingRequiredAssets ? 'border-amber-400/50' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="attachment-state">Run Attachments</p>
          <span className="attachment-meta">{selectedRunMedia.length} selected</span>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onOpenRunPicker}>
          Add Files To Run
        </Button>
      </div>

      {hasMissingRequiredAssets && (
        <div className="attachment-item border-amber-400/40 bg-amber-500/10 space-y-1">
          <p className="text-xs text-amber-200 uppercase tracking-wide">Missing Required Checkpoint Assets</p>
          {unmetRequiredCheckpointRows.map((row) => (
            <p key={row.id} className="attachment-meta text-amber-100">
              {row.name}: {renderMissingDetails(row)}
            </p>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={onOpenRunPicker}>
            Open Attach Browser
          </Button>
        </div>
      )}

      {selectedRunMedia.length === 0 ? (
        <p className="attachment-meta">
          No files selected for the next pipeline run. Use <strong>Add Files To Run</strong> to choose from your media library.
        </p>
      ) : (
        <div className="space-y-1 max-h-40 overflow-auto pr-1">
          {selectedRunMedia.map((item) => {
            const mediaId = item.media_id || item.id;
            return (
              <div key={mediaId} className="attachment-item flex items-center gap-2">
                {mediaPreview(item)}
                <div className="min-w-0">
                  <p className="text-xs text-zinc-200 truncate">{item.name || mediaId}</p>
                  <p className="attachment-meta truncate">
                    {item.type || 'unknown'} · {item.source || 'unknown'} · {mediaId}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="attachment-meta">
        Removal and metadata edits are available inside Media Upload Library (Upload/Browse mode).
      </p>
    </div>
  );
};

export default RunAttachmentsSection;
