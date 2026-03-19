import React from 'react';
import API from '../../api/api';
import { ClipPrompt } from '../../api/structs';
import { ClipStyleSelector } from '../selectors';
import { Button, Input } from '../ui';
import Modal from './Modal';
import InheritedAttachmentsSection from './edit-clip-prompt/InheritedAttachmentsSection';
import MetadataFieldsSection from './edit-clip-prompt/MetadataFieldsSection';
import MusicBindingSection from './edit-clip-prompt/MusicBindingSection';
import { normalizeMetadataForSubmit } from './edit-clip-prompt/utils';
import { useEditClipPromptState } from './edit-clip-prompt/useEditClipPromptState';
import { useToast } from '../../hooks/useToast';

interface EditClipPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  clip: ClipPrompt;
  onSave: () => void;
}

const EditClipPromptModal: React.FC<EditClipPromptModalProps> = ({ isOpen, onClose, clip, onSave }) => {
  const toast = useToast();
  const {
    name,
    setName,
    style,
    setStyle,
    metadata,
    styles,
    styleSchema,
    metadataFields,
    isLoading,
    setIsLoading,
    isLoadingStyles,
    isLoadingSchema,
    schemaError,
    isLoadingMedia,
    availableMedia,
    musicMediaId,
    setMusicMediaId,
    musicMediaOptions,
    selectedMusic,
    inheritedAttachments,
    generatedInheritedAttachments,
    selectedReferenceKeys,
    handleMetadataChange,
    toggleReferenceAsset,
  } = useEditClipPromptState({ isOpen, clip });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await API.editClipPrompt(clip.id, {
        name,
        clipStyle: style,
        music_media_id: musicMediaId || null,
        metadata: normalizeMetadataForSubmit(metadata, musicMediaId || undefined),
      });
      onSave();
      onClose();
    } catch (error: any) {
      toast({ text: `Failed: ${error.message}`, level: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Clip" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wide text-zinc-400 mb-1">Name</label>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Clip name..." />
        </div>

        <ClipStyleSelector value={style} onChange={setStyle} styles={styles} isLoading={isLoadingStyles} />

        <InheritedAttachmentsSection
          inheritedAttachments={inheritedAttachments}
          generatedInheritedAttachments={generatedInheritedAttachments}
          selectedReferenceKeys={selectedReferenceKeys}
          onUseMusic={(mediaId) => setMusicMediaId(mediaId)}
          onToggleReference={toggleReferenceAsset}
        />

        <MusicBindingSection
          musicMediaId={musicMediaId}
          isLoadingMedia={isLoadingMedia}
          musicMediaOptions={musicMediaOptions}
          selectedMusic={selectedMusic}
          onMusicChange={setMusicMediaId}
          onClearMusic={() => setMusicMediaId('')}
        />

        {schemaError && (
          <div className="text-sm text-zinc-200 bg-black/50 border border-white/10 rounded p-2">{schemaError}</div>
        )}
        {isLoadingSchema && <p className="text-sm text-slate-400">Loading style schema...</p>}

        <MetadataFieldsSection
          style={style}
          styleSchema={styleSchema}
          metadata={metadata}
          metadataFields={metadataFields}
          availableMedia={availableMedia}
          isLoadingMedia={isLoadingMedia}
          onMetadataChange={handleMetadataChange}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit" loading={isLoading}>Save</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditClipPromptModal;
