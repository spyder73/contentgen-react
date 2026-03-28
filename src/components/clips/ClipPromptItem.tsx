import React, { useState } from 'react';
import { ClipCostSummary } from '../../api/clip';
import { ClipPrompt } from '../../api/structs/clip';
import { getFileType } from '../../api/structs/clip';
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
  costSummary: ClipCostSummary | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRefresh: () => void;
  mediaProfile: MediaProfile;
  activeAccount: Account | null;
}

const toCaptionString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
};

const extractCaption = (clip: ClipPrompt): string => {
  const metadata = clip.metadata || {};
  const caption = metadata.caption
    ?? metadata.post_caption
    ?? metadata.postCaption
    ?? metadata.social_caption
    ?? metadata.socialCaption;
  return toCaptionString(caption);
};

const formatClipCost = (summary: ClipCostSummary): string => {
  const usd = summary.total_usd ?? 0;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(usd);
  return formatted;
};

const ClipPromptItem: React.FC<ClipPromptItemProps> = ({
  clip,
  costSummary,
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
  const clipCaption = extractCaption(clip);
  const hasOutput =
    fileUrls.length > 0 &&
    fileUrls.some((url) => getFileType(url) !== 'unknown') &&
    !fileUrls.some((url) => url.includes('waiting'));
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
      return <Badge variant="green">{fileUrls.length} outputs</Badge>;
    }
    if (hasOutput) {
      return <Badge variant="green">Rendered</Badge>;
    }
    return <Badge variant="blue">Draft</Badge>;
  };

  return (
    <>
      <Card hover className="animate-fade-in">
        <Card.Body className="overflow-hidden">
          {/* Header */}
          <div className="flex flex-col gap-2 mb-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h3 className="text-white font-medium truncate max-w-full lg:max-w-xs">
                {clip.name || 'Untitled Clip'}
              </h3>
              {getStatusBadge()}
              <span className="text-slate-400 text-sm">{totalMedia} media</span>
              <Badge variant="gray">{clipStyle}</Badge>
              {costSummary && costSummary.total_usd > 0 && (
                <span className="text-slate-400 text-sm">{formatClipCost(costSummary)}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1 justify-start lg:justify-end">
              <Button variant="ghost" size="sm" onClick={onToggleExpand}>
                {isExpanded ? 'Collapse' : 'Expand'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowEditModal(true)}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                Delete
              </Button>
            </div>
          </div>

          {/* Collapsed: Thumbnails */}
          {!isExpanded && images.length > 0 && (
            <div className="max-w-full flex gap-2 overflow-x-auto pb-2">
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
                    initialCaption={clipCaption}
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
