import React, { useState } from 'react';
import { ImagePrompt, constructImageUrl } from '../api/api';
import { 
  ImagePreviewModal, 
  EditImagePromptModal, 
  EditImageTextModal 
} from './modals';

interface ImagePromptItemProps {
  imagePrompt: ImagePrompt;
  cacheBuster?: number;
  onEditPrompt: (id: string, newPrompt: string) => void;
  onEditText: (id: string, newText: string) => void;
  onRegenerate: (id: string) => void;
  onDelete: (id: string) => void;
}

const ImagePromptItem: React.FC<ImagePromptItemProps> = ({
  imagePrompt,
  cacheBuster,
  onEditPrompt,
  onEditText,
  onRegenerate,
  onDelete
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showEditPrompt, setShowEditPrompt] = useState(false);
  const [showEditText, setShowEditText] = useState(false);

  const isWaiting = imagePrompt.file_url === '/assets/_waiting.png';
  const isFailed = imagePrompt.file_url === '/assets/_failed.png';

  // Use cache buster for the image URL
  const imageUrl = constructImageUrl(imagePrompt.file_url, cacheBuster);

  return (
    <>
      <div className="flex flex-col items-center">
        <div className="w-[200px] text-center mb-1 text-slate-300 text-sm truncate" title={imagePrompt.text}>
          {imagePrompt.text}
        </div>
        
        <img
          key={imageUrl} // Force re-render when URL changes
          src={imageUrl}
          alt={imagePrompt.text}
          className={`w-[200px] h-[200px] object-cover rounded-xl cursor-pointer hover:scale-105 transition-transform ${isFailed ? 'border-2 border-red-500' : ''}`}
          onClick={() => setShowPreview(true)}
        />

        <div className="w-[200px] flex justify-end gap-1 mt-1">
          <button
            onClick={() => setShowEditPrompt(true)}
            disabled={isWaiting}
            className={`p-1 rounded text-sm ${isWaiting ? 'text-slate-600' : 'text-slate-300 hover:bg-slate-600'}`}
            title="Edit the Prompt"
          >
            ✏️
          </button>

          <button
            onClick={() => setShowEditText(true)}
            disabled={isWaiting}
            className={`p-1 rounded text-sm ${isWaiting ? 'text-slate-600' : 'text-slate-300 hover:bg-slate-600'}`}
            title="Edit the Text"
          >
            📝
          </button>

          <button
            onClick={() => onRegenerate(imagePrompt.id)}
            disabled={isWaiting}
            className={`p-1 rounded text-sm ${isWaiting ? 'text-slate-600' : 'text-slate-300 hover:bg-slate-600'}`}
            title="Regenerate"
          >
            🔄
          </button>

          <button
            onClick={() => onDelete(imagePrompt.id)}
            disabled={isWaiting}
            className={`p-1 rounded text-sm ${isWaiting ? 'text-slate-600' : 'text-red-400 hover:bg-slate-600'}`}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Modals */}
      <ImagePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        imageUrl={imageUrl}
      />

      <EditImagePromptModal
        isOpen={showEditPrompt}
        onClose={() => setShowEditPrompt(false)}
        imagePrompt={imagePrompt}
        onSubmit={(newPrompt) => onEditPrompt(imagePrompt.id, newPrompt)}
      />

      <EditImageTextModal
        isOpen={showEditText}
        onClose={() => setShowEditText(false)}
        imagePrompt={imagePrompt}
        onSubmit={(newText) => onEditText(imagePrompt.id, newText)}
      />
    </>
  );
};

export default ImagePromptItem;