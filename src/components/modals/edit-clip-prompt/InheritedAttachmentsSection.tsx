import React from 'react';
import { AvailableMediaItem } from '../../../api/clip';
import { AttachmentProvenanceItem, isGeneratedAttachmentSource } from '../../clips/attachmentProvenance';
import { Button } from '../../ui';
import { formatSourceLabel, isMusicMedia } from './utils';

interface InheritedAttachmentsSectionProps {
  inheritedAttachments: AttachmentProvenanceItem[];
  generatedInheritedAttachments: AttachmentProvenanceItem[];
  selectedReferenceKeys: Set<string | undefined>;
  onUseMusic: (mediaId: string) => void;
  onToggleReference: (item: AttachmentProvenanceItem) => void;
}

const InheritedAttachmentsSection: React.FC<InheritedAttachmentsSectionProps> = ({
  inheritedAttachments,
  generatedInheritedAttachments,
  selectedReferenceKeys,
  onUseMusic,
  onToggleReference,
}) => (
  <div className="space-y-2 pt-3 border-t border-white/10">
    <p className="text-xs uppercase tracking-[0.15em] text-white font-medium">Inherited Attachments</p>
    {inheritedAttachments.length === 0 ? (
      <p className="attachment-meta">No inherited run attachments were found on this clip prompt.</p>
    ) : (
      <div className="space-y-2 max-h-44 overflow-auto pr-1">
        {inheritedAttachments.map((item) => {
          const itemKey = item.media_id || item.id;
          const isReferenceSelected = selectedReferenceKeys.has(itemKey);
          const showReferenceToggle = Boolean(itemKey) && (isGeneratedAttachmentSource(item.source) || Boolean(item.source_checkpoint_id));
          const originLabel = item.source_checkpoint_name || item.source_checkpoint_id;

          return (
            <div key={`${item.id}-${item.source}-${item.source_checkpoint_index ?? ''}`} className="attachment-item flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-zinc-100 truncate">{item.name}</p>
                <p className="attachment-meta">
                  {item.type} · role: {item.role || 'reference'} · source: {formatSourceLabel(item.source)}
                  {originLabel ? ` · from ${originLabel}` : ''}
                  {item.media_id ? ` · ${item.media_id}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {isMusicMedia({
                  id: item.media_id || item.id,
                  type: item.type,
                  name: item.name,
                  mime_type: item.mime_type,
                  source: item.source,
                } as AvailableMediaItem) && item.media_id && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onUseMusic(item.media_id || '')}>
                    Use Music
                  </Button>
                )}
                {showReferenceToggle && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onToggleReference(item)}>
                    {isReferenceSelected ? 'Unmark Ref' : 'Use as Ref'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
    {generatedInheritedAttachments.length > 0 && (
      <p className="attachment-meta">
        Generated pipeline assets can be toggled as `reference_assets` for prompt assembly.
      </p>
    )}
  </div>
);

export default InheritedAttachmentsSection;
