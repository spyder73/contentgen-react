import React from 'react';
import { AvailableMediaItem } from '../../../api/clip';
import { Button, Select } from '../../ui';
import { MusicOption } from './types';

interface MusicMediaSectionProps {
  value: string;
  options: MusicOption[];
  selectedMusic: AvailableMediaItem | null;
  onChange: (mediaId: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

const MusicMediaSection: React.FC<MusicMediaSectionProps> = ({
  value,
  options,
  selectedMusic,
  onChange,
  onClear,
  disabled,
}) => (
  <div className="space-y-2">
    <label className="attachment-state">Music Media</label>
    <div className="flex flex-col gap-2 sm:flex-row">
      <Select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        options={options}
        className="flex-1"
        selectSize="sm"
        placeholder={options.length === 0 ? 'No music media found' : 'Select music media...'}
        disabled={disabled || options.length === 0}
      />
      <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={disabled || !value}>
        Remove
      </Button>
    </div>
    {selectedMusic && (
      <p className="attachment-meta">
        Selected: {selectedMusic.name} ({selectedMusic.type})
      </p>
    )}
  </div>
);

export default MusicMediaSection;
