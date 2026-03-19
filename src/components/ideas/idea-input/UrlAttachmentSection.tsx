import React from 'react';
import { Button, Input, Select } from '../../ui';
import { ATTACHMENT_TYPE_OPTIONS, AttachmentType } from './types';

interface UrlAttachmentSectionProps {
  attachmentType: AttachmentType;
  attachmentUrl: string;
  onAttachmentTypeChange: (value: AttachmentType) => void;
  onAttachmentUrlChange: (value: string) => void;
  onAddUrl: () => void;
  disabled?: boolean;
}

const UrlAttachmentSection: React.FC<UrlAttachmentSectionProps> = ({
  attachmentType,
  attachmentUrl,
  onAttachmentTypeChange,
  onAttachmentUrlChange,
  onAddUrl,
  disabled,
}) => (
  <div className="space-y-2">
    <label className="attachment-state">Attach URL</label>
    <div className="flex flex-col gap-2 sm:flex-row">
      <Select
        value={attachmentType}
        onChange={(event) => onAttachmentTypeChange(event.target.value as AttachmentType)}
        options={ATTACHMENT_TYPE_OPTIONS}
        selectSize="sm"
      />
      <Input
        value={attachmentUrl}
        onChange={(event) => onAttachmentUrlChange(event.target.value)}
        placeholder="https://..."
        inputSize="sm"
        className="flex-1"
        disabled={disabled}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onAddUrl}
        disabled={disabled || !attachmentUrl.trim()}
      >
        Add URL
      </Button>
    </div>
  </div>
);

export default UrlAttachmentSection;
