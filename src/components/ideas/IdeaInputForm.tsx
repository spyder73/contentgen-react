import React from 'react';
import { MediaLibraryItem } from '../../api/media';
import { PipelineTemplate } from '../../api/structs';
import { PipelineInputAttachment } from '../../api/structs/pipeline';
import { Button } from '../ui';
import { AssetPoolItem } from './assetPool';
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
        submitDisabled={!input.trim() || loading || Boolean(disabled)}
        submitError={submitError}
        showRequiredAssetWarning={false}
      />

      <div className="attachment-surface space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="attachment-state">Run Attachments</p>
            <span className="attachment-meta">{selectedRunMedia.length} selected</span>
          </div>
          <div className="flex items-center gap-2">
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRunMedia([])}
              disabled={selectedRunMedia.length === 0}
            >
              Clear Selection
            </Button>
          </div>
        </div>

        {selectedRunMedia.length === 0 ? (
          <p className="attachment-meta">
            No files selected for the next pipeline run. Use <strong>Add Files To Run</strong> to choose from your media library.
          </p>
        ) : (
          <div className="space-y-1 max-h-32 overflow-auto pr-1">
            {selectedRunMedia.map((item) => {
              const mediaId = item.media_id || item.id;
              return (
                <div key={mediaId} className="attachment-item flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-200 truncate">{item.name || mediaId}</p>
                    <p className="attachment-meta truncate">
                      {item.type || 'unknown'} · {item.source || 'unknown'} · {mediaId}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelectedRunMedia((previous) =>
                        previous.filter((candidate) => (candidate.media_id || candidate.id) !== mediaId)
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
