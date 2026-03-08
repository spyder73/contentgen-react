import React from 'react';
import { Button } from '../../ui';

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
}) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const openPicker = () => inputRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    onUploadFilesChange(Array.from(files || []));
  };

  const previewFile = uploadFiles[0] || null;
  const previewUrl = React.useMemo(
    () => {
      if (!previewFile) return '';
      if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return '';
      return URL.createObjectURL(previewFile);
    },
    [previewFile]
  );

  React.useEffect(
    () => () => {
      if (previewUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl]
  );

  const renderPreview = () => {
    if (!previewFile || !previewUrl) return null;
    if (previewFile.type.startsWith('image/')) {
      return <img src={previewUrl} alt={previewFile.name} className="w-14 h-14 rounded object-cover border border-white/20" />;
    }
    if (previewFile.type.startsWith('video/')) {
      return <video src={previewUrl} className="w-14 h-14 rounded object-cover border border-white/20" muted playsInline preload="metadata" />;
    }
    if (previewFile.type.startsWith('audio/')) {
      return <audio src={previewUrl} controls preload="metadata" className="w-full max-w-xs" />;
    }
    return (
      <div className="w-14 h-14 rounded border border-white/20 bg-black/50 flex items-center justify-center text-[10px] text-zinc-400 uppercase">
        File
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <p className="attachment-meta">
        Upload files to your media library. Files appear in browse folders by media type.
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        aria-label="File input"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={openPicker}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openPicker();
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            const nextTarget = event.relatedTarget;
            if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFiles(event.dataTransfer.files);
          }}
          className={`w-28 h-28 rounded bg-black border transition flex flex-col items-center justify-center gap-1 ${
            isDragging ? 'border-white text-white' : 'border-white/25 text-zinc-300'
          }`}
          aria-label="Attach files tile"
        >
          <span className="text-4xl leading-none">+</span>
          <span className="attachment-meta text-center px-2">Click or Drop</span>
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="attachment-meta">
            {uploadFiles.length > 0
              ? `${uploadFiles.length} file${uploadFiles.length === 1 ? '' : 's'} selected`
              : 'No files selected yet'}
          </p>
          {previewFile && (
            <div className="attachment-item flex items-center gap-2">
              {renderPreview()}
              <div className="min-w-0">
                <p className="text-xs text-zinc-100 truncate">{previewFile.name}</p>
                <p className="attachment-meta">
                  {previewFile.type || 'unknown'} {previewFile.size ? `· ${previewFile.size} bytes` : ''}
                </p>
              </div>
            </div>
          )}
          <p className="attachment-meta">Use the square tile for both picker and drag/drop.</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
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
};

export default UploadTab;
