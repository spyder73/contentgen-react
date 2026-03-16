import React from 'react';
import { MediaLibraryItem } from '../../api/media';
import { PipelineTemplate } from '../../api/structs';
import { PipelineInputAttachment } from '../../api/structs/pipeline';
import { AssetPoolItem, evaluateCheckpointRequirements, extractCheckpointRequirements } from './assetPool';
import AttachmentLibraryModal from './AttachmentLibraryModal';
import IdeaStartControls from './idea-input/IdeaStartControls';
import RunAttachmentsSection from './idea-input/RunAttachmentsSection';
import { buildRunAttachments, toAssetPoolItem } from './idea-input/attachmentPayload';
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
  workspaceResetSignal?: number;
}

const IdeaInputForm: React.FC<Props> = ({
  templates,
  onStart,
  generatedAssets = [],
  disabled,
  openLibrarySignal = 0,
  workspaceResetSignal = 0,
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
  const lastWorkspaceResetSignalRef = React.useRef(workspaceResetSignal);

  React.useEffect(() => {
    if (templates.length > 0 && !templateId) setTemplateId(templates[0].id);
  }, [templateId, templates]);

  React.useEffect(() => {
    if (openLibrarySignal === lastLibrarySignalRef.current) return;
    lastLibrarySignalRef.current = openLibrarySignal;
    setLibraryModalMode('manage');
    setIsLibraryModalOpen(true);
  }, [openLibrarySignal]);

  React.useEffect(() => {
    if (workspaceResetSignal === lastWorkspaceResetSignalRef.current) return;
    lastWorkspaceResetSignalRef.current = workspaceResetSignal;
    setSelectedRunMedia([]);
    setIsLibraryModalOpen(false);
    setLibraryModalMode('select');
  }, [workspaceResetSignal]);

  const templateOptions = React.useMemo(() => templates.map((template) => ({ value: template.id, label: template.name })), [templates]);
  const selectedTemplate = React.useMemo(() => templates.find((template) => template.id === templateId) || null, [templateId, templates]);

  const checkpointsWithAttachmentIntent = React.useMemo(() => {
    if (!selectedTemplate) return [];
    return selectedTemplate.checkpoints
      .map((checkpoint) => ({
        id: checkpoint.id,
        name: checkpoint.name,
        allowAttachments: Boolean(checkpoint.allow_attachments),
        requirements: extractCheckpointRequirements(checkpoint),
      }))
      .filter((row) => row.allowAttachments || row.requirements.length > 0);
  }, [selectedTemplate]);

  const selectedRunAssets = React.useMemo<AssetPoolItem[]>(() => {
    return selectedRunMedia.map((item) => toAssetPoolItem(item));
  }, [selectedRunMedia]);

  const unmetRequiredCheckpointRows = React.useMemo(
    () => checkpointsWithAttachmentIntent
      .map((row) => ({
        ...row,
        startRequirements: row.requirements.filter((requirement) => requirement.source.trim().toLowerCase() === 'initial'),
      }))
      .map((row) => ({
        ...row,
        summary: evaluateCheckpointRequirements(row.startRequirements, selectedRunAssets),
      }))
      .filter((row) => row.requirements.length > 0 && !row.summary.satisfied),
    [checkpointsWithAttachmentIntent, selectedRunAssets]
  );

  const shouldShowAttachmentUI = checkpointsWithAttachmentIntent.length > 0;
  const hasMissingRequiredAssets = unmetRequiredCheckpointRows.length > 0;
  const runAttachments = React.useMemo<PipelineInputAttachment[]>(() => buildRunAttachments({
    shouldShowAttachmentUI,
    selectedRunMedia,
  }), [selectedRunMedia, shouldShowAttachmentUI]);

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
        | { response?: { data?: { error?: string; message?: string } }; message?: string }
        | undefined;
      setSubmitError(record?.response?.data?.error || record?.response?.data?.message || record?.message || 'Failed to start pipeline run.');
    } finally {
      setLoading(false);
    }
  };

  const handleLibraryConfirm = (items: MediaLibraryItem[]) => {
    setSelectedRunMedia(items);
    setIsLibraryModalOpen(false);
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

      <RunAttachmentsSection
        selectedRunMedia={selectedRunMedia}
        shouldShowAttachmentUI={shouldShowAttachmentUI}
        hasMissingRequiredAssets={hasMissingRequiredAssets}
        unmetRequiredCheckpointRows={unmetRequiredCheckpointRows}
        onOpenRunPicker={() => {
          setLibraryModalMode('select');
          setIsLibraryModalOpen(true);
        }}
      />

      <AttachmentLibraryModal
        isOpen={isLibraryModalOpen}
        mode={libraryModalMode}
        generatedAssets={generatedAssets}
        initialSelectedMediaIds={selectedRunMedia.map((item) => item.media_id || item.id)}
        onClose={() => setIsLibraryModalOpen(false)}
        onConfirmSelection={handleLibraryConfirm}
      />
    </form>
  );
};

export default IdeaInputForm;
