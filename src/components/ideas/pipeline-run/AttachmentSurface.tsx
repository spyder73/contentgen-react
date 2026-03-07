import React from 'react';
import { PipelineRun } from '../../../api/structs';
import { formatMetadataValue } from './helpers';

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
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="attachment-meta underline mt-1 inline-block"
                  >
                    {attachment.url}
                  </a>
                ) : (
                  <p className="attachment-meta mt-1">No URL provided.</p>
                )}
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
