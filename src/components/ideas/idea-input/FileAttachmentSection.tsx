import React from 'react';
import { Select } from '../../ui';
import { ATTACHMENT_TYPE_OPTIONS, FileAttachmentMode } from './types';

interface FileAttachmentSectionProps {
  fileAttachmentType: FileAttachmentMode;
  isDraggingFiles: boolean;
  isUploadingFiles?: boolean;
  disabled?: boolean;
  onFileAttachmentTypeChange: (value: FileAttachmentMode) => void;
  onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDragEnter: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
}

const FileAttachmentSection: React.FC<FileAttachmentSectionProps> = ({
  fileAttachmentType,
  isDraggingFiles,
  isUploadingFiles,
  disabled,
  onFileAttachmentTypeChange,
  onFileInputChange,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}) => (
  <div className="space-y-2">
    <label className="attachment-state">Attach File</label>
    <div
      className={`rounded border border-dashed px-3 py-3 ${
        isDraggingFiles ? 'border-blue-400 bg-blue-900/20' : 'border-white/20 bg-black/10'
      }`}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <p className="attachment-meta mb-2">Drop files here or use the picker below.</p>
      {isUploadingFiles && <p className="attachment-meta mb-2">Uploading files to media library...</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          value={fileAttachmentType}
          onChange={(event) => onFileAttachmentTypeChange(event.target.value as FileAttachmentMode)}
          options={[{ value: 'auto', label: 'Auto by file type' }, ...ATTACHMENT_TYPE_OPTIONS]}
          selectSize="sm"
        />
        <input
          type="file"
          onChange={onFileInputChange}
          className="block w-full text-xs text-slate-300 file:mr-2 file:rounded-none file:border file:border-white/20 file:bg-black/30 file:px-2 file:py-1 file:text-xs file:text-slate-200"
          disabled={disabled}
        />
      </div>
    </div>
  </div>
);

export default FileAttachmentSection;
