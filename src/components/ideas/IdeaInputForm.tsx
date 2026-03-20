import React from 'react';
import { MediaLibraryItem } from '../../api/media';
import { PipelineTemplate } from '../../api/structs';
import { PipelineInputAttachment } from '../../api/structs/pipeline';
import AttachmentLibraryModal from './AttachmentLibraryModal';
import IdeaStartControls from './idea-input/IdeaStartControls';
import { AssetPoolItem } from './assetPool';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import ExternalAPI from '../../api/external';
import { DEFAULT_CHAT_PROVIDER, DEFAULT_CHAT_MODEL } from '../../api/structs/providers';

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
  const [enhancing, setEnhancing] = React.useState(false);
  const [submitError, setSubmitError] = React.useState('');
  const [promptEnhancerProvider] = useLocalStorage('promptEnhancerProvider', DEFAULT_CHAT_PROVIDER);
  const [promptEnhancerModel] = useLocalStorage('promptEnhancerModel', DEFAULT_CHAT_MODEL);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = React.useState(false);
  const lastLibrarySignalRef = React.useRef(openLibrarySignal);
  const lastWorkspaceResetSignalRef = React.useRef(workspaceResetSignal);

  React.useEffect(() => {
    if (templates.length > 0 && !templateId) setTemplateId(templates[0].id);
  }, [templateId, templates]);

  React.useEffect(() => {
    if (openLibrarySignal === lastLibrarySignalRef.current) return;
    lastLibrarySignalRef.current = openLibrarySignal;
    setIsLibraryModalOpen(true);
  }, [openLibrarySignal]);

  React.useEffect(() => {
    if (workspaceResetSignal === lastWorkspaceResetSignalRef.current) return;
    lastWorkspaceResetSignalRef.current = workspaceResetSignal;
    setIsLibraryModalOpen(false);
  }, [workspaceResetSignal]);

  const templateOptions = React.useMemo(() => templates.map((template) => ({ value: template.id, label: template.name })), [templates]);

  const handleEnhance = async () => {
    if (!input.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const enhanced = await ExternalAPI.enhancePrompt(input.trim(), promptEnhancerProvider, promptEnhancerModel);
      if (enhanced) setInput(enhanced);
    } catch (error) {
      console.error('Prompt enhancement failed:', error);
    } finally {
      setEnhancing(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || !templateId) return;
    setSubmitError('');
    setLoading(true);
    try {
      await onStart(input.trim(), templateId, autoMode, [], null);
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
        onEnhance={handleEnhance}
        enhancing={enhancing}
      />

      <AttachmentLibraryModal
        isOpen={isLibraryModalOpen}
        mode="manage"
        generatedAssets={generatedAssets}
        initialSelectedMediaIds={[]}
        onClose={() => setIsLibraryModalOpen(false)}
        onConfirmSelection={() => setIsLibraryModalOpen(false)}
      />
    </form>
  );
};

export default IdeaInputForm;
