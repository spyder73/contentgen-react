import React, { useState } from 'react';
import { MediaItem, MediaType } from '../../../api/structs/media';
import { Generator } from '../../../api/structs/providers';
import { MediaSection } from '../../ui';
import { AddMediaModal, MediaPreviewModal } from '../../modals';

interface MediaEditorSectionProps {
  clipId: string;
  images: MediaItem[];
  aiVideos: MediaItem[];
  audios: MediaItem[];
  clipStyle: string;
  onRefresh: () => void;
  imageGenerator: Generator;
  imageModel: string;
  videoGenerator: Generator;
  videoModel: string;
  audioGenerator: Generator;
  audioModel: string;
}

const MediaEditorSection: React.FC<MediaEditorSectionProps> = ({
  clipId,
  images,
  aiVideos,
  audios,
  clipStyle,
  onRefresh,
  imageGenerator,
  imageModel,
  videoGenerator,
  videoModel,
  audioGenerator,
  audioModel,
}) => {
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [addMediaType, setAddMediaType] = useState<MediaType>('image');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'video'>('image');

  const getGenerator = (type: MediaType): Generator => {
    switch (type) {
      case 'image': return imageGenerator;
      case 'ai_video': return videoGenerator;
      case 'audio': return audioGenerator;
    }
  };

  const getModel = (type: MediaType): string => {
    switch (type) {
      case 'image': return imageModel;
      case 'ai_video': return videoModel;
      case 'audio': return audioModel;
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
      </div>

      <AddMediaModal
        isOpen={showAddMediaModal}
        onClose={() => setShowAddMediaModal(false)}
        clipId={clipId}
        onSuccess={onRefresh}
        defaultType={addMediaType}
        imageGenerator={imageGenerator}
        imageModel={imageModel}
        videoGenerator={videoGenerator}
        videoModel={videoModel}
        audioGenerator={audioGenerator}
        audioModel={audioModel}
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