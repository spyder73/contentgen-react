import React from 'react';
import { MediaItem } from '../../api/structs/media';
import { Generator } from '../../api/structs/providers';
import { MediaItemComponent } from '../clips';
import Button from './Button';

interface MediaSectionProps {
  title: string;
  icon: string;
  items: MediaItem[];
  clipStyle: string;
  onRefresh: () => void;
  generator: Generator;
  model: string;
  onPreview?: (url: string) => void;
  onAdd: () => void;
}

const MediaSection: React.FC<MediaSectionProps> = ({
  title,
  icon,
  items,
  clipStyle,
  onRefresh,
  generator,
  model,
  onPreview,
  onAdd,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-slate-400 text-sm font-medium">
          {icon} {title} ({items.length})
        </p>
        <Button variant="ghost" size="sm" onClick={onAdd}>
          ➕
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <MediaItemComponent
              key={item.id}
              mediaItem={item}
              clipStyle={clipStyle}
              onRefresh={onRefresh}
              generator={generator}
              model={model}
              onPreview={onPreview}
            />
          ))}
        </div>
      ) : (
        <p className="text-slate-600 text-xs">No {title.toLowerCase()} yet</p>
      )}
    </div>
  );
};

export default MediaSection;