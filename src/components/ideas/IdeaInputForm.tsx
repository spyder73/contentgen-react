import React from 'react';
import { PipelineTemplate } from '../../api/structs';
import { PipelineInputAttachment } from '../../api/structs/pipeline';
import { Button } from '../ui';
import { AssetPoolItem } from './assetPool';
import CheckpointBindingsSection from './idea-input/CheckpointBindingsSection';
import FileAttachmentSection from './idea-input/FileAttachmentSection';
import GeneratedOutputsSection from './idea-input/GeneratedOutputsSection';
import IdeaStartControls from './idea-input/IdeaStartControls';
import MediaCatalogSection from './idea-input/MediaCatalogSection';
import MusicMediaSection from './idea-input/MusicMediaSection';
import SelectedAssetsSection from './idea-input/SelectedAssetsSection';
import UrlAttachmentSection from './idea-input/UrlAttachmentSection';
import { useIdeaInputFormState } from './idea-input/useIdeaInputFormState';

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
}

const IdeaInputForm: React.FC<Props> = ({
  templates,
  onStart,
  generatedAssets = [],
  disabled,
}) => {
  const state = useIdeaInputFormState({
    templates,
    onStart,
    generatedAssets,
    disabled,
  });

  return (
    <form onSubmit={state.handleSubmit} className="space-y-3">
      <IdeaStartControls
        input={state.input}
        onInputChange={state.setInput}
        templateId={state.templateId}
        onTemplateChange={state.setTemplateId}
        templateOptions={state.templateOptions}
        autoMode={state.autoMode}
        onToggleAutoMode={() => state.setAutoMode((value) => !value)}
        loading={state.loading}
        disabled={state.disabled}
        submitDisabled={state.submitDisabled}
        submitError={state.submitError}
        showRequiredAssetWarning={state.unmetRequiredCheckpoints.length > 0}
      />

      <div className="attachment-surface space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="attachment-state">Attachment Workspace</p>
            <span className="attachment-meta">{state.pipelineAttachmentCount} attached</span>
            <span className="attachment-meta">{state.isAttachmentPoolExpanded ? 'Expanded' : 'Collapsed'}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => state.setIsAttachmentPoolExpanded((value) => !value)}
          >
            {state.isAttachmentPoolExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>

        {state.isAttachmentPoolExpanded && (
          <>
            <MusicMediaSection
              value={state.musicMediaId}
              options={state.musicOptions}
              selectedMusic={state.selectedMusic}
              onChange={state.setMusicMediaId}
              onClear={() => state.setMusicMediaId('')}
              disabled={state.disabled}
            />
            <MediaCatalogSection
              availableMedia={state.availableMedia}
              assetPoolById={state.assetPoolById}
              onAddAsset={state.addAssetToPool}
            />
            <GeneratedOutputsSection
              generatedAssets={state.generatedAssets}
              assetPoolById={state.assetPoolById}
              onAddAsset={state.addAssetToPool}
            />
            <UrlAttachmentSection
              attachmentType={state.attachmentType}
              attachmentUrl={state.attachmentUrl}
              onAttachmentTypeChange={state.setAttachmentType}
              onAttachmentUrlChange={state.setAttachmentUrl}
              onAddUrl={state.handleAddUrlAttachment}
              disabled={state.disabled}
            />
            <FileAttachmentSection
              fileAttachmentType={state.fileAttachmentType}
              isDraggingFiles={state.isDraggingFiles}
              isUploadingFiles={state.isUploadingFiles}
              disabled={state.disabled}
              onFileAttachmentTypeChange={state.setFileAttachmentType}
              onFileInputChange={state.handleFileInputChange}
              onDragEnter={state.handleDragEnter}
              onDragOver={state.handleDragOver}
              onDragLeave={state.handleDragLeave}
              onDrop={state.handleDrop}
            />
            <SelectedAssetsSection
              assetPool={state.assetPool}
              onRemoveAsset={state.removeAssetFromPool}
              disabled={state.disabled}
            />
            <CheckpointBindingsSection
              rows={state.checkpointBindingRows}
              assetPool={state.assetPool}
              checkpointBindings={state.checkpointBindings}
              onToggleBinding={state.toggleCheckpointBinding}
            />
          </>
        )}
      </div>
    </form>
  );
};

export default IdeaInputForm;
