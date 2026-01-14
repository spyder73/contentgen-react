import React, { useState } from 'react';
import { ClipPrompt } from '../../api/structs/clip';
import { MediaType } from '../../api/structs/media';
import { Account } from '../../api/structs/user';
import { ImageProvider, VideoProvider, AudioProvider, Generator } from '../../api/structs/providers';
import { Card, Button, Badge, Thumbnail, MediaSection } from '../ui';
import { constructMediaUrl } from '../../api/helpers';
import ClipPlayer from './ClipPlayer';
import ScheduleButton from './ScheduleButton';
import { EditClipPromptModal, AddMediaModal, MediaPreviewModal, ConfirmModal } from '../modals';
import API from '../../api/api';

interface ClipPromptItemProps {
  clip: ClipPrompt;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRefresh: () => void;
  imageProvider: ImageProvider;
  imageModel: string;
  videoProvider: VideoProvider;
  videoModel: string;
  audioProvider: AudioProvider;
  audioModel: string;
  activeAccount: Account | null;
}

const ClipPromptItem: React.FC<ClipPromptItemProps> = ({
  clip,
  isExpanded,
  onToggleExpand,
  onRefresh,
  imageProvider,
  imageModel,
  videoProvider,
  videoModel,
  audioProvider,
  audioModel,
  activeAccount,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addMediaType, setAddMediaType] = useState<MediaType>('image');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'video'>('image');

  const images = clip.media?.images || [];
  const aiVideos = clip.media?.ai_videos || [];
  const audios = clip.media?.audios || [];
  const totalMedia = images.length + aiVideos.length + audios.length;
  const hasRenderedVideo = !!clip.file_url;
  const clipStyle = clip.style?.style || 'standard';

  const getGenerator = (type: MediaType): Generator => {
    switch (type) {
      case 'image': return imageProvider;
      case 'ai_video': return videoProvider;
      case 'audio': return audioProvider;
    }
  };

  const getModel = (type: MediaType): string => {
    switch (type) {
      case 'image': return imageModel;
      case 'ai_video': return videoModel;
      case 'audio': return audioModel;
    }
  };

  const handleDelete = async () => {
    try {
      await API.deleteClipPrompt(clip.id);
      onRefresh();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handlePreview = (url: string, type: MediaType) => {
    setPreviewUrl(url);
    setPreviewType(type === 'ai_video' ? 'video' : 'image');
  };

  const openAddMedia = (type: MediaType) => {
    setAddMediaType(type);
    setShowAddMediaModal(true);
  };

  return (
    <>
      <Card hover className="animate-fade-in">
        <Card.Body>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-white font-medium truncate max-w-xs">
                {clip.name || 'Untitled Clip'}
              </h3>
              <Badge variant={hasRenderedVideo ? 'green' : 'blue'}>
                {hasRenderedVideo ? '✓ Rendered' : 'Draft'}
              </Badge>
              <span className="text-slate-400 text-sm">{totalMedia} media</span>
              <Badge variant="gray">{clipStyle || 'standard'}</Badge>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={onToggleExpand}>
                {isExpanded ? '▲' : '▼'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowEditModal(true)}>
                ✏️
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                🗑️
              </Button>
            </div>
          </div>

          {/* Collapsed: Thumbnails */}
          {!isExpanded && images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.slice(0, 5).map((img) => (
                <Thumbnail
                  key={img.id}
                  src={constructMediaUrl(img.file_url)}
                  alt={img.prompt}
                  size="md"
                />
              ))}
              {images.length > 5 && (
                <div className="w-16 h-16 bg-slate-700 rounded flex items-center justify-center text-slate-400 text-sm">
                  +{images.length - 5}
                </div>
              )}
            </div>
          )}

          {/* Expanded */}
          {isExpanded && (
            <div className="space-y-4 mt-4">
              <MediaSection
                title="Images"
                icon="🖼️"
                items={images}
                clipStyle={clipStyle}
                onRefresh={onRefresh}
                generator={getGenerator('image')}
                model={getModel('image')}
                onPreview={(url) => handlePreview(url, 'image')}
                onAdd={() => openAddMedia('image')}
              />

              <MediaSection
                title="AI Videos"
                icon="🎬"
                items={aiVideos}
                clipStyle={clipStyle}
                onRefresh={onRefresh}
                generator={getGenerator('ai_video')}
                model={getModel('ai_video')}
                onPreview={(url) => handlePreview(url, 'ai_video')}
                onAdd={() => openAddMedia('ai_video')}
              />

              <MediaSection
                title="Audio"
                icon="🎵"
                items={audios}
                clipStyle={clipStyle}
                onRefresh={onRefresh}
                generator={getGenerator('audio')}
                model={getModel('audio')}
                onAdd={() => openAddMedia('audio')}
              />

              {hasRenderedVideo && (
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">📹 Rendered Video</p>
                  <ClipPlayer clipUrl={constructMediaUrl(clip.file_url)} />
                </div>
              )}

              {hasRenderedVideo && activeAccount && (
                <ScheduleButton clipId={clip.id} activeAccount={activeAccount} />
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      <EditClipPromptModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        clip={clip}
        onSave={onRefresh}
      />

      <AddMediaModal
        isOpen={showAddMediaModal}
        onClose={() => setShowAddMediaModal(false)}
        clipId={clip.id}
        onSuccess={onRefresh}
        defaultType={addMediaType}
        imageGenerator={imageProvider}
        imageModel={imageModel}
        videoGenerator={videoProvider}
        videoModel={videoModel}
        audioGenerator={audioProvider}
        audioModel={audioModel}
      />

      <MediaPreviewModal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        mediaUrl={previewUrl || ''}
        mediaType={previewType}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Clip"
        message={`Are you sure you want to delete "${clip.name || 'this clip'}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};

export default ClipPromptItem;