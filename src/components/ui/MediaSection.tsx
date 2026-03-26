import React from 'react';
import { MediaItem } from '../../api/structs/media';
import { MediaOutputSpec } from '../../api/structs/media-spec';
import { ClipStyleField } from '../../api/clipstyleSchema';
import { MediaItemComponent } from '../clips';
import { Button } from '../ui';

interface MediaSectionProps {
  title: string;
  icon: string;
  items: MediaItem[];
  clipStyle: string;
  mediaMetadataFields?: Record<'image' | 'ai_video' | 'audio', ClipStyleField[]>;
  onRefresh: () => void;
  outputSpec?: MediaOutputSpec;
  onPreview?: (url: string) => void;
  onAdd?: () => void;
  onLipSync?: (item: MediaItem) => void;
}

const MediaSection: React.FC<MediaSectionProps> = ({
  title,
  icon,
  items,
  clipStyle,
  mediaMetadataFields,
  onRefresh,
  outputSpec,
  onPreview,
  onAdd,
  onLipSync,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-slate-300">
          {icon ? `${icon} ` : ''}{title} ({items.length})
        </h4>
        {onAdd && (
          <Button size="sm" variant="ghost" onClick={onAdd}>
            + Add
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-500 italic">None yet</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <MediaItemComponent
              key={item.id}
              item={item}
              clipStyle={clipStyle}
              metadataFields={mediaMetadataFields?.[item.type] || []}
              onRefresh={onRefresh}
              outputSpec={item.output_spec ?? outputSpec}
              onPreview={onPreview}
              onLipSync={onLipSync}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaSection;
