import React from 'react';
import { MediaLibraryItem } from '../../../api/media';
import { Button } from '../../ui';

interface SeedReferenceSectionProps {
  selectedSeedReference: MediaLibraryItem | null;
  onOpenSeedPicker: () => void;
  onClearSeed: () => void;
}

const SeedReferenceSection: React.FC<SeedReferenceSectionProps> = ({
  selectedSeedReference,
  onOpenSeedPicker,
  onClearSeed,
}) => (
  <div className="attachment-surface space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <p className="attachment-state">Seed Reference Image</p>
        <span className="attachment-meta">{selectedSeedReference ? 'Selected' : 'Missing'}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onOpenSeedPicker}>
          {selectedSeedReference ? 'Change Seed Reference' : 'Select Seed Reference'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClearSeed} disabled={!selectedSeedReference}>
          Clear
        </Button>
      </div>
    </div>

    {selectedSeedReference ? (
      <div className="attachment-item flex items-center gap-2">
        <div className="min-w-0">
          <p className="text-xs text-zinc-200 truncate">{selectedSeedReference.name || selectedSeedReference.id}</p>
          <p className="attachment-meta truncate">
            {selectedSeedReference.type || 'unknown'} · {selectedSeedReference.source || 'unknown'} ·{' '}
            {selectedSeedReference.media_id || selectedSeedReference.id}
          </p>
        </div>
      </div>
    ) : (
      <p className="attachment-meta">
        This template requires an image reference asset. Select an image before starting.
      </p>
    )}
  </div>
);

export default SeedReferenceSection;
