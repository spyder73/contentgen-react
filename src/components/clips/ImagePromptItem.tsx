import React, { useState } from 'react';
import API from '../../api/api';
import { ImagePrompt } from '../../api/structs/clip';
import { ImageProvider } from '../../api/structs/providers';
import { constructMediaUrl } from '../../api/helpers';
import { Button, Thumbnail } from '../ui';
import { EditImagePromptModal, EditImageTextModal } from '../modals';

interface ImagePromptItemProps {
  imagePrompt: ImagePrompt;
  onRefresh: () => void;
  imageProvider: ImageProvider;
  imageModel: string;
  onPreview: (url: string) => void;
}

const ImagePromptItem: React.FC<ImagePromptItemProps> = ({
  imagePrompt,
  onRefresh,
  imageProvider,
  imageModel,
  onPreview,
}) => {
  const [showEditPrompt, setShowEditPrompt] = useState(false);
  const [showEditText, setShowEditText] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await API.regenerateImage(
        imagePrompt.id,
        imageProvider,
        imageProvider === 'openrouter' ? imageModel : undefined
      );
      onRefresh();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await API.deleteImagePrompt(imagePrompt.id);
      onRefresh();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    }
  };

  const imageUrl = constructMediaUrl(imagePrompt.file_url);

  // Check if image is still loading (waiting/failed placeholder)
  const isWaiting = imagePrompt.file_url?.includes('_waiting') || false;
  const isFailed = imagePrompt.file_url?.includes('_failed') || false;

  return (
    <>
      <div className="flex gap-3 p-2 bg-slate-700/30 rounded-lg">
        {/* Thumbnail */}
        <div className="relative">
          <Thumbnail
            src={imageUrl}
            alt={imagePrompt.prompt}
            size="lg"
            onClick={() => !isWaiting && !isFailed && onPreview(imageUrl)}
          />
          {isWaiting && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 rounded">
              <span className="animate-pulse">⏳</span>
            </div>
          )}
          {isFailed && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 rounded">
              <span>❌</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm truncate-2 mb-1">{imagePrompt.prompt}</p>
          {imagePrompt.text && (
            <p className="text-muted text-xs truncate">Text: {imagePrompt.text}</p>
          )}
          {isWaiting && (
            <p className="text-yellow-400 text-xs mt-1">Generating...</p>
          )}
          {isFailed && (
            <p className="text-red-400 text-xs mt-1">Generation failed</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowEditPrompt(true)}
            title="Edit prompt"
          >
            ✏️
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowEditText(true)}
            title="Edit text overlay"
          >
            📝
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRegenerate}
            disabled={isRegenerating}
            title="Regenerate image"
          >
            {isRegenerating ? '⏳' : '🔄'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDelete}
            title="Delete image"
          >
            🗑️
          </Button>
        </div>
      </div>

      {/* Modals */}
      <EditImagePromptModal
        isOpen={showEditPrompt}
        onClose={() => setShowEditPrompt(false)}
        imagePrompt={imagePrompt}
        onSave={onRefresh}
        imageProvider={imageProvider}
        imageModel={imageModel}
      />

      <EditImageTextModal
        isOpen={showEditText}
        onClose={() => setShowEditText(false)}
        imagePrompt={imagePrompt}
        onSave={onRefresh}
      />
    </>
  );
};

export default ImagePromptItem;