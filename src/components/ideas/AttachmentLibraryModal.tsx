import React from 'react';
import { MediaLibraryItem } from '../../api/media';
import { Button } from '../ui';
import { Modal } from '../modals';
import { AssetPoolItem } from './assetPool';
import BrowseTab from './attachment-library/BrowseTab';
import UploadTab from './attachment-library/UploadTab';
import {
  AttachmentLibraryMode,
  useAttachmentLibraryState,
} from './attachment-library/useAttachmentLibraryState';

interface AttachmentLibraryModalProps {
  isOpen: boolean;
  mode: AttachmentLibraryMode;
  generatedAssets?: AssetPoolItem[];
  initialSelectedMediaIds?: string[];
  onClose: () => void;
  onConfirmSelection?: (items: MediaLibraryItem[]) => void;
}

const AttachmentLibraryModal: React.FC<AttachmentLibraryModalProps> = ({
  isOpen,
  mode,
  generatedAssets = [],
  initialSelectedMediaIds = [],
  onClose,
  onConfirmSelection,
}) => {
  const {
    activeItem,
    activeTab,
    contextDraft,
    renameDraft,
    errorMessage,
    filteredItems,
    folderCounts,
    folderType,
    handleRemoveActive,
    handleFileClick,
    handleRenameActive,
    handleSaveContext,
    handleUpload,
    handleSearchSubmit,
    handlePageChange,
    loadLibrary,
    deleting,
    loading,
    renaming,
    savingContext,
    searchQuery,
    selectedItems,
    selectedIds,
    setActiveTab,
    setContextDraft,
    setFolderType,
    setRenameDraft,
    setSearchQuery,
    setSourceFilter,
    setUploadFiles,
    sourceFilter,
    statusMessage,
    uploadFiles,
    uploading,
    currentPage,
    totalPages,
    totalItems,
  } = useAttachmentLibraryState({
    isOpen,
    mode,
    generatedAssets,
    initialSelectedMediaIds,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'manage' ? 'Media Upload Library' : 'Select Files For Next Run'}
      size="lg"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'upload' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload Files
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'browse' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('browse')}
          >
            Browse Files
          </button>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => void loadLibrary()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {activeTab === 'upload' ? (
        <UploadTab
          uploadFiles={uploadFiles}
          uploading={uploading}
          onUploadFilesChange={setUploadFiles}
          onUpload={() => void handleUpload()}
        />
      ) : (
        <BrowseTab
          loading={loading}
          folderType={folderType}
          sourceFilter={sourceFilter}
          searchQuery={searchQuery}
          folderCounts={folderCounts}
          filteredItems={filteredItems}
          selectedIds={selectedIds}
          activeItem={activeItem}
          mode={mode}
          contextDraft={contextDraft}
          renameDraft={renameDraft}
          savingContext={savingContext}
          renaming={renaming}
          deleting={deleting}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onFolderTypeChange={setFolderType}
          onSourceFilterChange={setSourceFilter}
          onSearchQueryChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          onPageChange={handlePageChange}
          onFileClick={(id) => void handleFileClick(id)}
          onContextDraftChange={setContextDraft}
          onRenameDraftChange={setRenameDraft}
          onSaveContext={() => void handleSaveContext()}
          onRename={() => void handleRenameActive()}
          onRemove={() => void handleRemoveActive()}
        />
      )}

      {errorMessage && <p className="text-xs text-rose-300">{errorMessage}</p>}
      {statusMessage && <p className="text-xs text-emerald-300">{statusMessage}</p>}

      {mode === 'select' && (
        <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            X Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onConfirmSelection?.(selectedItems)}
            disabled={selectedItems.length === 0}
          >
            Add Selected ({selectedItems.length})
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default AttachmentLibraryModal;
