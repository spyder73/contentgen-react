import React from 'react';
import { Button, Input } from '../../ui';

interface UploadTabProps {
  uploadFiles: File[];
  uploading: boolean;
  onUploadFilesChange: (files: File[]) => void;
  onUpload: () => void;
}

const UploadTab: React.FC<UploadTabProps> = ({
  uploadFiles,
  uploading,
  onUploadFilesChange,
  onUpload,
}) => (
  <div className="space-y-3">
    <p className="attachment-meta">
      Upload files to your media library. Files will appear in browse folders by type.
    </p>
    <Input
      type="file"
      multiple
      aria-label="File input"
      onChange={(event) => onUploadFilesChange(Array.from(event.target.files || []))}
    />
    <div className="flex items-center justify-between gap-2">
      <p className="attachment-meta">
        {uploadFiles.length > 0
          ? `${uploadFiles.length} file${uploadFiles.length === 1 ? '' : 's'} selected`
          : 'No files selected'}
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onUpload}
        disabled={uploading || uploadFiles.length === 0}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </Button>
    </div>
  </div>
);

export default UploadTab;
