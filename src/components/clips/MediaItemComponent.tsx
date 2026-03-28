import React, { useState } from 'react';
import API from '../../api/api';
import { MediaItem } from '../../api/structs/media';
import { MediaOutputSpec } from '../../api/structs/media-spec';
import { ClipStyleField } from '../../api/clipstyleSchema';
import { EditMediaModal } from '../modals';
import { Button, Thumbnail } from '../ui';
import { constructMediaUrl } from '../../api/helpers';
import { useToast } from '../../hooks/useToast';

interface MediaItemComponentProps {
  item: MediaItem;
  clipStyle: string;
  metadataFields: ClipStyleField[];
  onRefresh: () => void;
  outputSpec?: MediaOutputSpec;
  onPreview?: (url: string) => void;
  onLipSync?: (item: MediaItem) => void;
}

const MediaItemComponent: React.FC<MediaItemComponentProps> = ({
  item,
  clipStyle,
  metadataFields,
  onRefresh,
  outputSpec,
  onPreview,
  onLipSync,
}) => {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSynced, setShowSynced] = useState(true);

  const originalUrl = item.metadata?.original_url as string | undefined;
  const isPending = !!item.metadata?.lip_sync_pending;

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await API.regenerateMedia(item.id, {
        output_spec: item.output_spec ?? outputSpec,
      });
      onRefresh();
    } catch (error: any) {
      toast({ text: `Failed to regenerate: ${error.message}`, level: 'error' });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await API.deleteMediaItem(item.id);
      onRefresh();
    } catch (error: any) {
      toast({ text: `Failed to delete: ${error.message}`, level: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const spec = item.output_spec ?? outputSpec;
  const displayFileUrl = originalUrl && !showSynced ? originalUrl : item.file_url;
  const displayItem = { ...item, file_url: displayFileUrl };

  return (
    <>
      <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors group">
        {/* Thumbnail */}
        {displayItem.file_url && displayItem.type !== 'audio' && (
          <div
            className="shrink-0 cursor-pointer relative"
            onClick={() => onPreview?.(constructMediaUrl(displayItem.file_url))}
          >
            <Thumbnail
              src={constructMediaUrl(displayItem.file_url)}
              alt={displayItem.prompt}
              size="sm"
            />
            {isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded text-[10px] text-white font-medium">
                Syncing...
              </div>
            )}
          </div>
        )}

        {/* Prompt text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-300 truncate" title={item.prompt}>
            {item.prompt}
          </p>
          {spec && (
            <p className="text-[10px] text-slate-500 mt-0.5">
              {spec.provider}/{spec.model}
              {spec.width && spec.height
                ? ` · ${spec.width}×${spec.height}`
                : ''}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? '...' : 'Regenerate'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '...' : 'Delete'}
          </Button>
          {originalUrl && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSynced((prev) => !prev)}
            >
              {showSynced ? 'Original' : 'Synced'}
            </Button>
          )}
          {item.type === 'ai_video' && onLipSync && (
            <Button
              size="sm"
              variant={item.metadata?.needs_lip_sync ? 'primary' : 'ghost'}
              onClick={() => onLipSync(item)}
            >
              Lip Sync
            </Button>
          )}
        </div>
      </div>

      <EditMediaModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        item={item}
        metadataFields={metadataFields}
        outputSpec={item.output_spec ?? outputSpec}
        onSuccess={() => {
          setIsEditing(false);
          onRefresh();
        }}
      />
    </>
  );
};

export default MediaItemComponent;
