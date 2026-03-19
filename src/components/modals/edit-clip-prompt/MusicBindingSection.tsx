import React from 'react';
import { AvailableMediaItem } from '../../../api/clip';
import { Button } from '../../ui';

interface MusicBindingSectionProps {
  musicMediaId: string;
  isLoadingMedia: boolean;
  musicMediaOptions: Array<{ value: string; label: string }>;
  selectedMusic: AvailableMediaItem | null;
  onMusicChange: (value: string) => void;
  onClearMusic: () => void;
}

const MusicBindingSection: React.FC<MusicBindingSectionProps> = ({
  musicMediaId,
  isLoadingMedia,
  musicMediaOptions,
  selectedMusic,
  onMusicChange,
  onClearMusic,
}) => (
  <div className="space-y-2 pt-3 border-t border-white/10">
    <p className="text-xs uppercase tracking-[0.15em] text-white font-medium">Music Attachment</p>
    <div className="flex flex-col gap-2 sm:flex-row">
      <select
        value={musicMediaId}
        onChange={(event) => onMusicChange(event.target.value)}
        className="w-full select sm:flex-1"
        disabled={isLoadingMedia}
      >
        <option value="">{isLoadingMedia ? 'Loading music media...' : 'Select music media...'}</option>
        {musicMediaOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <Button type="button" variant="ghost" onClick={onClearMusic} disabled={!musicMediaId}>
        Remove
      </Button>
    </div>
    {selectedMusic && (
      <p className="attachment-meta">Selected: {selectedMusic.name} ({selectedMusic.type})</p>
    )}
    <p className="attachment-meta">Audio options include inherited run attachments and media-library audio items.</p>
    <p className="attachment-meta">Save to apply music `media_id` to this clip prompt.</p>
  </div>
);

export default MusicBindingSection;
