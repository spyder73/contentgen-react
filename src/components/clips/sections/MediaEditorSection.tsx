import React, { useState } from 'react';
import { MediaItem, MediaType } from '../../../api/structs/media';
import { MediaProfile, MediaOutputSpec } from '../../../api/structs/media-spec';
import { MediaSection } from '../../ui';
import { AddMediaModal, MediaPreviewModal } from '../../modals';

interface MediaEditorSectionProps {
  clipId: string;
  images: MediaItem[];
  aiVideos: MediaItem[];
  audios: MediaItem[];
  clipStyle: string;
  onRefresh: () => void;
  mediaProfile: MediaProfile;
}

const MediaEditorSection: React.FC<MediaEditorSectionProps> = ({
  clipId,
  images,
  aiVideos,
  audios,
  clipStyle,
  onRefresh,
  mediaProfile,
}) => {
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [addMediaType, setAddMediaType] = useState<MediaType>('image');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'video'>('image');

  const getOutputSpec = (type: MediaType): MediaOutputSpec | undefined => {
    switch (type) {
      case 'image': return mediaProfile.image;
      case 'ai_video': return mediaProfile.video;
      case 'audio': return mediaProfile.audio;
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
      <div className="space-y-4">
        <MediaSection
          title="Images"
          icon="🖼️"
          items={images}
          clipStyle={clipStyle}
          onRefresh={onRefresh}
          outputSpec={getOutputSpec('image')}
          onPreview={(url) => handlePreview(url, 'image')}
          onAdd={() => openAddMedia('image')}
        />

        <MediaSection
          title="AI Videos"
          icon="🎬"
          items={aiVideos}
          clipStyle={clipStyle}
          onRefresh={onRefresh}
          outputSpec={getOutputSpec('ai_video')}
          onPreview={(url) => handlePreview(url, 'ai_video')}
          onAdd={() => openAddMedia('ai_video')}
        />

        <MediaSection
          title="Audio"
          icon="🎵"
          items={audios}
          clipStyle={clipStyle}
          onRefresh={onRefresh}
          outputSpec={getOutputSpec('audio')}
          onAdd={() => openAddMedia('audio')}
        />
      </div>

      <AddMediaModal
        isOpen={showAddMediaModal}
        onClose={() => setShowAddMediaModal(false)}
        clipId={clipId}
        onSuccess={onRefresh}
        defaultType={addMediaType}
        mediaProfile={mediaProfile}
      />

      <MediaPreviewModal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        mediaUrl={previewUrl || ''}
        mediaType={previewType}
      />
    </>
  );
};

export default MediaEditorSection;
