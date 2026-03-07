import React, { useCallback, useMemo, useState } from 'react';
import API from '../../api/api';
import { AvailableMediaItem } from '../../api/clip';
import { PipelineTemplate } from '../../api/structs';
import { PipelineInputAttachment } from '../../api/structs/pipeline';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Button, Input, Select, TextArea } from '../ui';

interface Props {
  templates: PipelineTemplate[];
  onStart: (
    input: string,
    templateId: string,
    autoMode: boolean,
    attachments: PipelineInputAttachment[],
    musicMediaId?: string | null
  ) => Promise<void>;
  disabled?: boolean;
}

type AttachmentType = 'music' | 'image' | 'video' | 'audio' | 'file';
type AttachmentSource = 'url' | 'file';
type FileAttachmentMode = AttachmentType | 'auto';

interface IdeaAttachmentDraft extends PipelineInputAttachment {
  id: string;
  type: AttachmentType;
  source: AttachmentSource;
  state: 'attached' | 'local_file';
}

const ATTACHMENT_TYPE_OPTIONS: Array<{ value: AttachmentType; label: string }> = [
  { value: 'music', label: 'Music' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'file', label: 'File' },
];

const isMusicMedia = (item: AvailableMediaItem): boolean => {
  const type = item.type.toLowerCase();
  if (type.includes('music')) return true;
  if (type === 'audio') return true;
  return Boolean(item.mime_type?.toLowerCase().startsWith('audio/'));
};

const inferAttachmentTypeFromFile = (file: File): AttachmentType => {
  if (file.type.startsWith('audio/')) return 'music';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'file';
};

const formatBytes = (value?: number): string => {
  if (!value || value <= 0) return '';
  if (value < 1024) return `${value} B`;
  const kb = value / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const IdeaInputForm: React.FC<Props> = ({ templates, onStart, disabled }) => {
  const [input, setInput] = useState('');
  const [templateId, setTemplateId] = useState(templates[0]?.id || '');
  const [autoMode, setAutoMode] = useLocalStorage('pipeline_auto_mode', true);
  const [loading, setLoading] = useState(false);
  const [attachmentType, setAttachmentType] = useState<AttachmentType>('music');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [fileAttachmentType, setFileAttachmentType] = useState<FileAttachmentMode>('auto');
  const [attachments, setAttachments] = useState<IdeaAttachmentDraft[]>([]);
  const [availableMedia, setAvailableMedia] = useState<AvailableMediaItem[]>([]);
  const [musicMediaId, setMusicMediaId] = useState('');
  const [isAttachmentPoolExpanded, setIsAttachmentPoolExpanded] = useState(true);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  React.useEffect(() => {
    if (templates.length && !templateId) {
      setTemplateId(templates[0].id);
    }
  }, [templates, templateId]);

  React.useEffect(() => {
    let cancelled = false;

    API.getAvailableMedia()
      .then((items) => {
        if (cancelled) return;
        setAvailableMedia(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableMedia([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const musicOptions = useMemo(
    () =>
      availableMedia
        .filter(isMusicMedia)
        .map((item) => ({
          value: item.id,
          label: `${item.name} (${item.type})`,
        })),
    [availableMedia]
  );

  const selectedMusic = useMemo(
    () => availableMedia.find((item) => item.id === musicMediaId) || null,
    [availableMedia, musicMediaId]
  );

  const addAttachment = (attachment: IdeaAttachmentDraft) => {
    setAttachments((prev) => [...prev, attachment]);
  };

  const addFilesAsAttachments = useCallback((files: File[]) => {
    if (files.length === 0) return;

    files.forEach((file) => {
      const inferredType = fileAttachmentType === 'auto' ? inferAttachmentTypeFromFile(file) : fileAttachmentType;

      addAttachment({
        id: `file-${file.name}-${file.lastModified}`,
        type: inferredType,
        source: 'file',
        state: 'local_file',
        name: file.name,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
        metadata: {
          file_name: file.name,
          last_modified: file.lastModified,
        },
      });
    });
  }, [fileAttachmentType]);

  const handleAddUrlAttachment = () => {
    const trimmed = attachmentUrl.trim();
    if (!trimmed) return;

    try {
      const parsed = new URL(trimmed);
      const filename = parsed.pathname.split('/').pop() || parsed.host || 'remote-asset';

      addAttachment({
        id: `url-${Date.now()}`,
        type: attachmentType,
        source: 'url',
        state: 'attached',
        url: parsed.toString(),
        name: filename,
        mime_type: 'application/octet-stream',
      });
      setAttachmentUrl('');
    } catch {
      alert('Please enter a valid URL.');
    }
  };

  const handleAddFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    addFilesAsAttachments(files);
    event.target.value = '';
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    setIsDraggingFiles(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    event.dataTransfer.dropEffect = 'copy';
    setIsDraggingFiles(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }
    setIsDraggingFiles(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFiles(false);
    if (disabled) return;

    const files = Array.from(event.dataTransfer.files || []);
    addFilesAsAttachments(files);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const pipelineAttachments = useMemo(() => {
    const base = attachments.map(({ id, ...attachment }) => attachment as PipelineInputAttachment);

    if (musicMediaId && !base.some((attachment) => attachment.media_id === musicMediaId)) {
      base.unshift({
        type: 'music',
        source: 'media',
        state: 'selected',
        media_id: musicMediaId,
        name: selectedMusic?.name || 'Selected music',
        mime_type: selectedMusic?.mime_type,
        url: selectedMusic?.url,
      });
    }

    return base;
  }, [attachments, musicMediaId, selectedMusic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !templateId) return;

    setLoading(true);
    try {
      await onStart(
        input.trim(),
        templateId,
        autoMode,
        pipelineAttachments,
        musicMediaId || null
      );
      setInput('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const templateOptions = templates.map((t) => ({
    value: t.id,
    label: t.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Describe your video idea..."
        rows={3}
        disabled={disabled}
      />

      <div className="flex items-center gap-3">
        <Select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          options={templateOptions}
          selectSize="sm"
          className="flex-1"
          placeholder="Select pipeline..."
          disabled={disabled}
        />

        {/* Auto Mode Toggle */}
        <button
          type="button"
          onClick={() => setAutoMode(!autoMode)}
          disabled={disabled}
          className={`
            flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors
            ${autoMode
              ? 'bg-green-600/20 text-green-400 border border-green-600/50'
              : 'bg-slate-700 text-slate-400 border border-slate-600'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}
          `}
          title={autoMode ? 'Auto mode: Pipeline runs automatically' : 'Manual mode: Confirm each step'}
        >
          {autoMode ? 'Auto' : 'Manual'}
        </button>

        <Button
          type="submit"
          disabled={!input.trim() || loading || disabled}
          loading={loading}
        >
          Generate
        </Button>
      </div>

      {!autoMode && (
        <p className="text-xs text-slate-500">
          Manual mode: You'll review and confirm each pipeline step
        </p>
      )}

      <div className="attachment-surface space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="attachment-state">Attachment Pool</p>
            <span className="attachment-meta">
              {pipelineAttachments.length} attached
            </span>
            <span className="attachment-meta">
              {isAttachmentPoolExpanded ? 'Expanded' : 'Collapsed'}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsAttachmentPoolExpanded((value) => !value)}
          >
            {isAttachmentPoolExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>

        {isAttachmentPoolExpanded && (
          <>
            <div className="space-y-2">
              <label className="attachment-state">Music Media</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={musicMediaId}
                  onChange={(e) => setMusicMediaId(e.target.value)}
                  options={musicOptions}
                  className="flex-1"
                  selectSize="sm"
                  placeholder={musicOptions.length === 0 ? 'No music media found' : 'Select music media...'}
                  disabled={disabled || musicOptions.length === 0}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMusicMediaId('')}
                  disabled={disabled || !musicMediaId}
                >
                  Remove
                </Button>
              </div>
              {selectedMusic && (
                <p className="attachment-meta">
                  Selected: {selectedMusic.name} ({selectedMusic.type})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="attachment-state">Attach URL</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={attachmentType}
                  onChange={(e) => setAttachmentType(e.target.value as AttachmentType)}
                  options={ATTACHMENT_TYPE_OPTIONS}
                  selectSize="sm"
                />
                <Input
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://..."
                  inputSize="sm"
                  className="flex-1"
                  disabled={disabled}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddUrlAttachment}
                  disabled={disabled || !attachmentUrl.trim()}
                >
                  Add URL
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="attachment-state">Attach File</label>
              <div
                className={`rounded border border-dashed px-3 py-3 ${
                  isDraggingFiles
                    ? 'border-blue-400 bg-blue-900/20'
                    : 'border-white/20 bg-black/10'
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <p className="attachment-meta mb-2">
                  Drop files here or use the picker below.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select
                    value={fileAttachmentType}
                    onChange={(e) => setFileAttachmentType(e.target.value as FileAttachmentMode)}
                    options={[
                      { value: 'auto', label: 'Auto by file type' },
                      ...ATTACHMENT_TYPE_OPTIONS,
                    ]}
                    selectSize="sm"
                  />
                  <input
                    type="file"
                    onChange={handleAddFiles}
                    className="block w-full text-xs text-slate-300 file:mr-2 file:rounded-none file:border file:border-white/20 file:bg-black/30 file:px-2 file:py-1 file:text-xs file:text-slate-200"
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {attachments.length === 0 ? (
                <p className="attachment-meta">No URL/file attachments yet.</p>
              ) : (
                attachments.map((attachment) => (
                  <div key={attachment.id} className="attachment-item flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-200 truncate">{attachment.name || attachment.url || attachment.id}</p>
                      <p className="attachment-meta">
                        {attachment.type} · {attachment.source} · {attachment.state}
                        {formatBytes(attachment.size_bytes) ? ` · ${formatBytes(attachment.size_bytes)}` : ''}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      disabled={disabled}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </form>
  );
};

export default IdeaInputForm;
