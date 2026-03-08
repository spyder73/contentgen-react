import React from 'react';
import { MediaLibraryItem } from '../../api/media';
import { PipelineTemplate } from '../../api/structs';
import { PipelineInputAttachment } from '../../api/structs/pipeline';
import { Button } from '../ui';
import {
  AssetPoolItem,
  evaluateCheckpointRequirements,
  extractCheckpointRequirements,
  normalizeAssetKind,
  normalizeAssetSource,
} from './assetPool';
import AttachmentLibraryModal from './AttachmentLibraryModal';
import IdeaStartControls from './idea-input/IdeaStartControls';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface Props {
  templates: PipelineTemplate[];
  onStart: (
    input: string,
    templateId: string,
    autoMode: boolean,
    attachments: PipelineInputAttachment[],
    musicMediaId?: string | null
  ) => Promise<void>;
  generatedAssets?: AssetPoolItem[];
  disabled?: boolean;
  openLibrarySignal?: number;
}

const IdeaInputForm: React.FC<Props> = ({
  templates,
  onStart,
  generatedAssets = [],
  disabled,
  openLibrarySignal = 0,
}) => {
  const [input, setInput] = React.useState('');
  const [templateId, setTemplateId] = React.useState(templates[0]?.id || '');
  const [autoMode, setAutoMode] = useLocalStorage('pipeline_auto_mode', true);
  const [loading, setLoading] = React.useState(false);
  const [submitError, setSubmitError] = React.useState('');
  const [selectedRunMedia, setSelectedRunMedia] = React.useState<MediaLibraryItem[]>([]);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = React.useState(false);
  const [libraryModalMode, setLibraryModalMode] = React.useState<'manage' | 'select'>('select');
  const lastLibrarySignalRef = React.useRef(openLibrarySignal);

  React.useEffect(() => {
    if (templates.length > 0 && !templateId) {
      setTemplateId(templates[0].id);
    }
  }, [templateId, templates]);

  React.useEffect(() => {
    if (openLibrarySignal === lastLibrarySignalRef.current) return;
    lastLibrarySignalRef.current = openLibrarySignal;
    setLibraryModalMode('manage');
    setIsLibraryModalOpen(true);
  }, [openLibrarySignal]);

  const templateOptions = React.useMemo(
    () => templates.map((template) => ({ value: template.id, label: template.name })),
    [templates]
  );

  const selectedTemplate = React.useMemo(
    () => templates.find((template) => template.id === templateId) || null,
    [templateId, templates]
  );

  const checkpointsWithAttachmentIntent = React.useMemo(() => {
    if (!selectedTemplate) return [];

    return selectedTemplate.checkpoints
      .map((checkpoint) => {
        const requirements = extractCheckpointRequirements(checkpoint);
        return {
          id: checkpoint.id,
          name: checkpoint.name,
          allowAttachments: Boolean(checkpoint.allow_attachments),
          requirements,
        };
      })
      .filter((row) => row.allowAttachments || row.requirements.length > 0);
  }, [selectedTemplate]);

  const selectedRunAssets = React.useMemo<AssetPoolItem[]>(
    () =>
      selectedRunMedia.map((item) => {
        const mediaId = item.media_id || item.id;
        const source = normalizeAssetSource(item.source);
        return {
          id: `media:${mediaId}`,
          media_id: mediaId,
          type: item.type || 'unknown',
          kind: normalizeAssetKind(item.type, item.mime_type),
          source: source === 'unknown' ? 'media' : source,
          name: item.name || mediaId,
          url: item.url,
          mime_type: item.mime_type,
          size_bytes: item.size_bytes,
          metadata: item.metadata,
        };
      }),
    [selectedRunMedia]
  );

  const unmetRequiredCheckpointRows = React.useMemo(
    () =>
      checkpointsWithAttachmentIntent
        .map((row) => {
          const summary = evaluateCheckpointRequirements(row.requirements, selectedRunAssets);
          return {
            ...row,
            summary,
          };
        })
        .filter((row) => row.requirements.length > 0 && !row.summary.satisfied),
    [checkpointsWithAttachmentIntent, selectedRunAssets]
  );

  const shouldShowAttachmentUI = checkpointsWithAttachmentIntent.length > 0;
  const hasMissingRequiredAssets = unmetRequiredCheckpointRows.length > 0;

  const toAttachmentType = React.useCallback((item: MediaLibraryItem): string => {
    const type = (item.type || '').toLowerCase();
    const mimeType = (item.mime_type || '').toLowerCase();
    if (type.includes('image') || mimeType.startsWith('image/')) return 'image';
    if (type.includes('video') || type.includes('ai_video') || mimeType.startsWith('video/')) return 'video';
    if (type.includes('audio') || type.includes('music') || mimeType.startsWith('audio/')) return 'audio';
    return item.type || 'file';
  }, []);

  const runAttachments = React.useMemo<PipelineInputAttachment[]>(
    () =>
      selectedRunMedia.map((item) => ({
        type: toAttachmentType(item),
        source: 'media',
        state: 'selected',
        media_id: item.media_id || item.id,
        name: item.name || item.media_id || item.id,
        filename: item.name || item.media_id || item.id,
        mime_type: item.mime_type,
        url: item.url,
        size_bytes: item.size_bytes,
        size: item.size_bytes,
        metadata: {
          ...(item.metadata || {}),
          library_source: item.source,
        },
      })),
    [selectedRunMedia, toAttachmentType]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || !templateId) return;
    setSubmitError('');
    if (hasMissingRequiredAssets) {
      const detail = unmetRequiredCheckpointRows
        .map((row) => {
          const missing = row.summary.details
            .filter((item) => !item.satisfied)
            .map((item) => `${item.requirement.label} (missing ${item.missing_count})`)
            .join(', ');
          return `${row.name}: ${missing}`;
        })
        .join(' | ');
      setSubmitError(`Missing required checkpoint assets: ${detail}`);
      return;
    }
    setLoading(true);
    try {
      await onStart(input.trim(), templateId, autoMode, runAttachments, null);
      setInput('');
    } catch (error) {
      const record = error as
        | {
            response?: { data?: { error?: string; message?: string } };
            message?: string;
          }
        | undefined;
      setSubmitError(
        record?.response?.data?.error ||
          record?.response?.data?.message ||
          record?.message ||
          'Failed to start pipeline run.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <IdeaStartControls
        input={input}
        onInputChange={setInput}
        templateId={templateId}
        onTemplateChange={setTemplateId}
        templateOptions={templateOptions}
        autoMode={autoMode}
        onToggleAutoMode={() => setAutoMode((value) => !value)}
        loading={loading}
        disabled={disabled}
        submitDisabled={!input.trim() || loading || Boolean(disabled) || hasMissingRequiredAssets}
        submitError={submitError}
        showRequiredAssetWarning={hasMissingRequiredAssets}
      />

      {shouldShowAttachmentUI ? (
        <div className={`attachment-surface space-y-3 ${hasMissingRequiredAssets ? 'border-amber-400/50' : ''}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="attachment-state">Run Attachments</p>
              <span className="attachment-meta">{selectedRunMedia.length} selected</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setLibraryModalMode('select');
                setIsLibraryModalOpen(true);
              }}
            >
              Add Files To Run
            </Button>
          </div>

          {hasMissingRequiredAssets && (
            <div className="attachment-item border-amber-400/40 bg-amber-500/10 space-y-1">
              <p className="text-xs text-amber-200 uppercase tracking-wide">Missing Required Checkpoint Assets</p>
              {unmetRequiredCheckpointRows.map((row) => (
                <p key={row.id} className="attachment-meta text-amber-100">
                  {row.name}: {row.summary.details
                    .filter((item) => !item.satisfied)
                    .map((item) => `${item.requirement.label} (missing ${item.missing_count})`)
                    .join(', ')}
                </p>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setLibraryModalMode('select');
                  setIsLibraryModalOpen(true);
                }}
              >
                Open Attach Browser
              </Button>
            </div>
          )}

          {selectedRunMedia.length === 0 ? (
            <p className="attachment-meta">
              No files selected for the next pipeline run. Use <strong>Add Files To Run</strong> to choose from your media library.
            </p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-auto pr-1">
              {selectedRunMedia.map((item) => {
                const mediaId = item.media_id || item.id;
                const type = (item.type || '').toLowerCase();
                const mime = (item.mime_type || '').toLowerCase();
                const previewUrl = (item.url || '').trim();
                const showImagePreview = Boolean(previewUrl) && (type.includes('image') || mime.startsWith('image/'));
                const showVideoPreview = Boolean(previewUrl) && (type.includes('video') || mime.startsWith('video/'));
                const showAudioPreview = Boolean(previewUrl) && (type.includes('audio') || type.includes('music') || mime.startsWith('audio/'));

                return (
                  <div key={mediaId} className="attachment-item flex items-center gap-2">
                    {showImagePreview && (
                      <img
                        src={previewUrl}
                        alt={item.name || mediaId}
                        className="w-10 h-10 rounded object-cover border border-white/20"
                        loading="lazy"
                      />
                    )}
                    {showVideoPreview && (
                      <video
                        src={previewUrl}
                        className="w-10 h-10 rounded object-cover border border-white/20"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    )}
                    {!showImagePreview && !showVideoPreview && (
                      <div className="w-10 h-10 rounded border border-white/20 bg-black/50 flex items-center justify-center text-[10px] text-zinc-400 uppercase">
                        {showAudioPreview ? 'Audio' : 'File'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-200 truncate">{item.name || mediaId}</p>
                      <p className="attachment-meta truncate">
                        {item.type || 'unknown'} · {item.source || 'unknown'} · {mediaId}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="attachment-meta">
            Removal and metadata edits are available inside Media Upload Library (Upload/Browse mode).
          </p>
        </div>
      ) : (
        <div className="attachment-surface">
          <p className="attachment-meta">
            This pipeline does not require attachments for its configured checkpoints.
          </p>
        </div>
      )}

      <AttachmentLibraryModal
        isOpen={isLibraryModalOpen}
        mode={libraryModalMode}
        generatedAssets={generatedAssets}
        initialSelectedMediaIds={selectedRunMedia.map((item) => item.media_id || item.id)}
        onClose={() => setIsLibraryModalOpen(false)}
        onConfirmSelection={(items) => {
          setSelectedRunMedia(items);
          setIsLibraryModalOpen(false);
        }}
      />
    </form>
  );
};

export default IdeaInputForm;
