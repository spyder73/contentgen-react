import React, { useState } from 'react';
import { ClipPrompt } from '../../api/structs/clip';
import { MediaProfile } from '../../api/structs/media-spec';
import { Account } from '../../api/structs/user';
import { Card, Button, Badge, Thumbnail, ExpandableSection } from '../ui';
import { constructMediaUrl } from '../../api/helpers';
import OutputGallery from './OutputGallery';
import { MediaEditorSection, ScheduleSection } from './sections';
import { EditClipPromptModal, ConfirmModal } from '../modals';
import API from '../../api/api';

interface ClipPromptItemProps {
  clip: ClipPrompt;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRefresh: () => void;
  mediaProfile: MediaProfile;
  activeAccount: Account | null;
}

const ClipPromptItem: React.FC<ClipPromptItemProps> = ({
  clip,
  isExpanded,
  onToggleExpand,
  onRefresh,
  mediaProfile,
  activeAccount,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const images = clip.media?.images || [];
  const aiVideos = clip.media?.ai_videos || [];
  const audios = clip.media?.audios || [];
  const totalMedia = images.length + aiVideos.length + audios.length;

  const fileUrls = clip.file_urls || [];
  const hasOutput = fileUrls.length > 0 && !fileUrls.some(url => url.includes('waiting'));
  const clipStyle = clip.style?.style || 'standard';

  const handleDelete = async () => {
    try {
      await API.deleteClipPrompt(clip.id);
      onRefresh();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const getStatusBadge = () => {
    if (hasOutput && fileUrls.length > 1) {
      return <Badge variant="green">✓ {fileUrls.length} outputs</Badge>;
    }
    if (hasOutput) {
      return <Badge variant="green">✓ Rendered</Badge>;
    }
    return <Badge variant="blue">Draft</Badge>;
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
              {getStatusBadge()}
              <span className="text-slate-400 text-sm">{totalMedia} media</span>
              <Badge variant="gray">{clipStyle}</Badge>
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

          {/* Expanded: Three Sections */}
          {isExpanded && (
            <div className="space-y-3 mt-4">
              {/* Section 1: Media Editor */}
              <ExpandableSection
                title="Media & Prompts"
                icon="🎨"
                badge={<Badge variant="gray">{totalMedia}</Badge>}
                defaultExpanded={true}
              >
                <MediaEditorSection
                  clipId={clip.id}
                  images={images}
                  aiVideos={aiVideos}
                  audios={audios}
                  clipStyle={clipStyle}
                  onRefresh={onRefresh}
                  mediaProfile={mediaProfile}
                />
              </ExpandableSection>

              {/* Section 2: Output Gallery */}
              <ExpandableSection
                title="Output Gallery"
                icon="📦"
                badge={
                  hasOutput ? (
                    <Badge variant="green">{fileUrls.length} files</Badge>
                  ) : (
                    <Badge variant="yellow">Not rendered</Badge>
                  )
                }
                defaultExpanded={hasOutput}
                disabled={!hasOutput}
              >
                <OutputGallery
                  fileUrls={fileUrls}
                  clipStyle={clipStyle}
                  originalImages={images}
                />
              </ExpandableSection>

              {/* Section 3: Schedule */}
              <ExpandableSection
                title="Schedule & Publish"
                icon="📅"
                badge={
                  activeAccount ? (
                    <Badge variant="blue">{activeAccount.username}</Badge>
                  ) : (
                    <Badge variant="gray">No account</Badge>
                  )
                }
                defaultExpanded={false}
                disabled={!hasOutput || !activeAccount}
              >
                {activeAccount && (
                  <ScheduleSection
                    clipId={clip.id}
                    activeAccount={activeAccount}
                    fileUrls={fileUrls}
                  />
                )}
              </ExpandableSection>
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
