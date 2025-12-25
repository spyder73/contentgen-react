import React, { useState } from 'react';
import { ClipPrompt } from '../../api/structs/clip';
import { Account } from '../../api/structs/user';
import { ImageProvider } from '../../api/structs/providers';
import { Card, Button, Badge, Thumbnail } from '../ui';
import { constructMediaUrl } from '../../api/helpers';
import ImagePromptItem from './ImagePromptItem';
import ClipPlayer from './ClipPlayer';
import ScheduleButton from './ScheduleButton';
import { 
  EditClipPromptModal, 
  AddImagePromptModal,
  ImagePreviewModal 
} from '../modals';

interface ClipPromptItemProps {
  clip: ClipPrompt;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  imageProvider: ImageProvider;
  imageModel: string;
  activeAccount: Account | null;
}

const ClipPromptItem: React.FC<ClipPromptItemProps> = ({
  clip,
  isExpanded,
  onToggleExpand,
  onDelete,
  onRefresh,
  imageProvider,
  imageModel,
  activeAccount,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const imageCount = clip.image_prompts?.length || 0;
  const videoCount = clip.ai_video_prompts?.length || 0;
  const hasVideo = !!clip.file_url;


  return (
    <>
      <Card hover className="animate-fade-in">
        <Card.Body>
          {/* Header Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge variant={hasVideo ? 'green' : 'blue'}>
                {hasVideo ? '✓ Rendered' : 'Draft'}
              </Badge>
              <span className="text-muted text-sm">
                {imageCount} images • {videoCount} videos
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onToggleExpand}>
                {isExpanded ? '▲ Collapse' : '▼ Expand'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowEditModal(true)}>
                ✏️
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete}>
                🗑️
              </Button>
            </div>
          </div>

          {!isExpanded && clip.image_prompts && clip.image_prompts.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {clip.image_prompts.slice(0, 5).map((img) => (
                <Thumbnail
                  key={img.id}
                  src={constructMediaUrl(img.file_url)}
                  alt={img.prompt}
                  size="md"
                  onClick={() => setPreviewImage(constructMediaUrl(img.file_url))}
                />
              ))}
              {imageCount > 5 && (
                <div className="w-16 h-16 bg-slate-700 rounded flex items-center justify-center text-muted text-sm shrink-0">
                  +{imageCount - 5}
                </div>
              )}
            </div>
          )}

          {/* Expanded Content */}
          {isExpanded && (
            <div className="space-y-4 mt-4">
              {/* Clip Info */}
              {clip.front_text && (
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-muted mb-1">Front Text</p>
                  <p className="text-white text-sm">
                    {Array.isArray(clip.front_text.frontText) 
                      ? clip.front_text.frontText.join(' ') 
                      : clip.front_text.frontText}
                  </p>
                </div>
              )}

              {/* Image Prompts */}
              {clip.image_prompts && clip.image_prompts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-muted text-sm font-medium">Images</p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowAddImageModal(true)}
                    >
                      ➕ Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {clip.image_prompts.map((img) => (
                      <ImagePromptItem
                        key={img.id}
                        imagePrompt={img}
                        onRefresh={onRefresh}
                        imageProvider={imageProvider}
                        imageModel={imageModel}
                        onPreview={(url) => setPreviewImage(url)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Video Player */}
              {hasVideo && (
                <div>
                  <p className="text-muted text-sm font-medium mb-2">Preview</p>
                  <ClipPlayer 
                    clipUrl={constructMediaUrl(clip.file_url!)} 
                  />
                </div>
              )}

              {/* Schedule Button */}
              {hasVideo && activeAccount && (
                <ScheduleButton
                  clipId={clip.id}
                  activeAccount={activeAccount}
                />
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modals */}
      <EditClipPromptModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        clip={clip}
        onSave={onRefresh}
      />

      <AddImagePromptModal
        isOpen={showAddImageModal}
        onClose={() => setShowAddImageModal(false)}
        clipId={clip.id}
        onSuccess={onRefresh}
        imageProvider={imageProvider}
        imageModel={imageModel}
      />

      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage || ''}
      />
    </>
  );
};

export default ClipPromptItem;