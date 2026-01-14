import React, { useState } from 'react';
import { MediaItem } from '../../api/structs/media';
import { Generator } from '../../api/structs/providers';
import { constructMediaUrl } from '../../api/helpers';
import { Thumbnail, Button } from '../ui';
import { EditMediaModal } from '../modals';
import API from '../../api/api';

interface MediaItemComponentProps {
  mediaItem: MediaItem;
  clipStyle: string;
  onRefresh: () => void;
  generator: Generator;
  model: string;
  onPreview?: (url: string) => void;
}

const MediaItemComponent: React.FC<MediaItemComponentProps> = ({
  mediaItem,
  clipStyle,
  onRefresh,
  generator,
  model,
  onPreview,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const mediaUrl = constructMediaUrl(mediaItem.file_url);
  const isWaiting = mediaItem.file_url === '/assets/_waiting.png';
  const isFailed = mediaItem.file_url === '/assets/_failed.png';

  const handleRegenerate = async () => {
    setIsLoading(true);
    try {
      await API.regenerateMedia(mediaItem.id, generator, model);
      onRefresh();
    } catch (error) {
      console.error('Regenerate failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await API.deleteMediaItem(mediaItem.id);
      onRefresh();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const renderPreview = () => {
    if (mediaItem.type === 'audio') {
      return (
        <div className="w-16 h-16 bg-slate-700 rounded flex items-center justify-center text-2xl">
          🎵
        </div>
      );
    }

    if (mediaItem.type === 'ai_video' && !isWaiting && !isFailed) {
      return (
        <video
          src={mediaUrl}
          className="w-16 h-16 object-cover rounded cursor-pointer"
          muted
          onClick={() => onPreview?.(mediaUrl)}
        />
      );
    }

    return (
      <Thumbnail
        src={mediaUrl}
        alt={mediaItem.prompt}
        size="md"
        onClick={() => !isWaiting && !isFailed && onPreview?.(mediaUrl)}
        className={isWaiting ? 'animate-pulse' : ''}
      />
    );
  };

  // Get display text from metadata (if any)
  const displayText = mediaItem.metadata?.text || mediaItem.metadata?.caption || null;

  return (
    <>
      <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded">
        {renderPreview()}

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm truncate">{mediaItem.prompt}</p>
          
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500 capitalize">
              {mediaItem.type.replace('_', ' ')}
            </span>
            
            {displayText && (
              <span className="text-xs text-slate-400 truncate">
                • "{displayText}"
              </span>
            )}
            
            {isWaiting && <span className="text-xs text-yellow-500">Generating...</span>}
            {isFailed && <span className="text-xs text-red-500">Failed</span>}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowEditModal(true)}
            title="Edit"
          >
            ✏️
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRegenerate} 
            loading={isLoading}
            title="Regenerate"
          >
            🔄
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDelete}
            title="Delete"
          >
            🗑️
          </Button>
        </div>
      </div>

      <EditMediaModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        mediaItem={mediaItem}
        clipStyle={clipStyle}
        onSave={onRefresh}
        generator={generator}
        model={model}
      />
    </>
  );
};

export default MediaItemComponent;