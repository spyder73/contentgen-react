import React from 'react';
import { PipelineRun } from '../../../api/structs';
import { formatMetadataValue } from './helpers';
import { constructMediaUrl } from '../../../api/helpers';

interface AttachmentSurfaceProps {
  heading: string;
  attachments?: PipelineRun['initial_attachments'];
  loadingText?: string;
  emptyText: string;
  unavailableText: string;
  errorText?: string;
}

const AttachmentSurface: React.FC<AttachmentSurfaceProps> = ({
  heading,
  attachments,
  loadingText,
  emptyText,
  unavailableText,
  errorText,
}) => {
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  const renderPreview = (attachment: NonNullable<AttachmentSurfaceProps['attachments']>[number]) => {
    const normalizedType = String(attachment.type || '').toLowerCase();
    const mimeType = String(attachment.mime_type || '').toLowerCase();
    const url = attachment.url ? constructMediaUrl(attachment.url) : '';
    const isImage = normalizedType.includes('image') || mimeType.startsWith('image/');
    const isVideo = normalizedType.includes('video') || mimeType.startsWith('video/');
    const isAudio = normalizedType.includes('audio') || mimeType.startsWith('audio/');

    if (!url) {
      return <p className="attachment-meta mt-1">No URL provided.</p>;
    }

    if (isImage) {
      return (
        <img
          src={url}
          alt={attachment.name || attachment.id}
          className="w-full max-h-44 object-contain rounded border border-white/15 bg-black/40 mt-2"
          loading="lazy"
        />
      );
    }

    if (isVideo) {
      return (
        <video
          src={url}
          className="w-full max-h-44 rounded border border-white/15 bg-black/40 mt-2"
          controls
          playsInline
          preload="metadata"
        />
      );
    }

    if (isAudio) {
      return (
        <audio
          src={url}
          className="w-full mt-2"
          controls
          preload="metadata"
        />
      );
    }

    return null;
  };

  return (
    <div className="attachment-surface space-y-2">
      <p className="attachment-state">{heading}</p>
      {loadingText && <p className="attachment-state">{loadingText}</p>}
      {errorText && <p className="attachment-state">{errorText}</p>}
      {!loadingText && !errorText && attachments === undefined && (
        <p className="attachment-state">{unavailableText}</p>
      )}
      {!loadingText && !errorText && Array.isArray(attachments) && attachments.length === 0 && (
        <p className="attachment-state">{emptyText}</p>
      )}
      {hasAttachments && (
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const metadataEntries = attachment.metadata ? Object.entries(attachment.metadata) : [];
            return (
              <div key={attachment.id} className="attachment-item">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-zinc-200 truncate">{attachment.name || attachment.id}</p>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-400">{attachment.type}</span>
                </div>
                <p className="attachment-meta mt-1">
                  MIME: {attachment.mime_type || 'unknown'}
                  {attachment.size_bytes ? ` | ${attachment.size_bytes} bytes` : ''}
                </p>
                {attachment.url ? (
                  <a
                    href={constructMediaUrl(attachment.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="attachment-meta underline mt-1 inline-block"
                  >
                    {attachment.url}
                  </a>
                ) : (
                  <p className="attachment-meta mt-1">No URL provided.</p>
                )}
                {renderPreview(attachment)}
                {metadataEntries.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {metadataEntries.map(([key, value]) => (
                      <p key={`${attachment.id}-${key}`} className="attachment-meta">
                        {key}: {formatMetadataValue(value)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AttachmentSurface;
