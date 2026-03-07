import React from 'react';
import API from '../../../api/api';
import { MediaLibraryItem } from '../../../api/media';
import { AssetPoolItem } from '../assetPool';
import {
  countItemsByFolder,
  filterLibraryItems,
  FolderType,
  inferUploadType,
  mergeLibraryItems,
  readMediaContextDraft,
  selectMediaItems,
  SourceFilter,
  toActionableError,
} from './helpers';

export type AttachmentLibraryMode = 'manage' | 'select';
export type AttachmentLibraryTab = 'upload' | 'browse';

interface UseAttachmentLibraryStateProps {
  isOpen: boolean;
  mode: AttachmentLibraryMode;
  generatedAssets: AssetPoolItem[];
  initialSelectedMediaIds: string[];
}

export const useAttachmentLibraryState = ({
  isOpen,
  mode,
  generatedAssets,
  initialSelectedMediaIds,
}: UseAttachmentLibraryStateProps) => {
  const [activeTab, setActiveTab] = React.useState<AttachmentLibraryTab>('browse');
  const [folderType, setFolderType] = React.useState<FolderType>('all');
  const [sourceFilter, setSourceFilter] = React.useState<SourceFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [items, setItems] = React.useState<MediaLibraryItem[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [activeMediaId, setActiveMediaId] = React.useState('');
  const [contextDraft, setContextDraft] = React.useState('');
  const [uploadFiles, setUploadFiles] = React.useState<File[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [savingContext, setSavingContext] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');

  const loadLibrary = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const libraryItems = await API.listMediaLibrary();
      setItems(mergeLibraryItems(Array.isArray(libraryItems) ? libraryItems : [], generatedAssets));
    } catch (error) {
      setErrorMessage(toActionableError(error));
      setItems(mergeLibraryItems([], generatedAssets));
    } finally {
      setLoading(false);
    }
  }, [generatedAssets]);

  React.useEffect(() => {
    if (!isOpen) return;
    setActiveTab(mode === 'manage' ? 'upload' : 'browse');
    setFolderType('all');
    setSourceFilter('all');
    setSearchQuery('');
    setSelectedIds(initialSelectedMediaIds);
    setActiveMediaId(initialSelectedMediaIds[0] || '');
    setContextDraft('');
    setUploadFiles([]);
    setStatusMessage('');
    setErrorMessage('');
    void loadLibrary();
  }, [initialSelectedMediaIds, isOpen, loadLibrary, mode]);

  const activeItem = React.useMemo(
    () => items.find((item) => (item.media_id || item.id) === activeMediaId) || null,
    [activeMediaId, items]
  );

  React.useEffect(() => {
    setContextDraft(readMediaContextDraft(activeItem));
  }, [activeItem]);

  const filteredItems = React.useMemo(
    () => filterLibraryItems(items, folderType, sourceFilter, searchQuery),
    [folderType, items, searchQuery, sourceFilter]
  );

  const folderCounts = React.useMemo(() => countItemsByFolder(items), [items]);

  const selectedItems = React.useMemo(() => selectMediaItems(items, selectedIds), [items, selectedIds]);

  const handleFileClick = (mediaId: string) => {
    setActiveMediaId(mediaId);
    if (mode !== 'select') return;
    setSelectedIds((previous) =>
      previous.includes(mediaId)
        ? previous.filter((id) => id !== mediaId)
        : [...previous, mediaId]
    );
  };

  const handleUpload = async () => {
    if (!uploadFiles.length) return;
    setUploading(true);
    setErrorMessage('');
    setStatusMessage('');
    let uploadedCount = 0;

    for (const file of uploadFiles) {
      try {
        await API.uploadMediaLibraryFile(file, {
          type: inferUploadType(file),
          source: 'manual_upload',
        });
        uploadedCount += 1;
      } catch (error) {
        setErrorMessage(toActionableError(error));
      }
    }

    setUploading(false);
    setUploadFiles([]);
    if (uploadedCount > 0) {
      setStatusMessage(`Uploaded ${uploadedCount} file${uploadedCount === 1 ? '' : 's'} successfully.`);
      setActiveTab('browse');
      await loadLibrary();
    }
  };

  const handleSaveContext = async () => {
    if (!activeItem || mode === 'select') return;
    const mediaId = (activeItem.media_id || activeItem.id || '').trim();
    if (!mediaId) return;

    setSavingContext(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      await API.editMediaMetadata(mediaId, 'user_context', contextDraft.trim());
      setItems((previous) =>
        previous.map((item) =>
          (item.media_id || item.id) === mediaId
            ? { ...item, metadata: { ...(item.metadata || {}), user_context: contextDraft.trim() } }
            : item
        )
      );
      setStatusMessage('Saved file context.');
    } catch (error) {
      setErrorMessage(toActionableError(error));
    } finally {
      setSavingContext(false);
    }
  };

  return {
    activeItem,
    activeTab,
    contextDraft,
    errorMessage,
    filteredItems,
    folderCounts,
    folderType,
    loading,
    savingContext,
    searchQuery,
    selectedItems,
    selectedIds,
    sourceFilter,
    statusMessage,
    uploadFiles,
    uploading,
    setActiveTab,
    setContextDraft,
    setFolderType,
    setSearchQuery,
    setSourceFilter,
    setUploadFiles,
    handleFileClick,
    handleSaveContext,
    handleUpload,
    loadLibrary,
  };
};
