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
  const wasOpenRef = React.useRef(false);
  const lastModeRef = React.useRef<AttachmentLibraryMode>(mode);
  const [activeTab, setActiveTab] = React.useState<AttachmentLibraryTab>('browse');
  const [folderType, setFolderType] = React.useState<FolderType>('all');
  const [sourceFilter, setSourceFilter] = React.useState<SourceFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [libraryItems, setLibraryItems] = React.useState<MediaLibraryItem[]>([]);
  const [dismissedMediaIds, setDismissedMediaIds] = React.useState<string[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [activeMediaId, setActiveMediaId] = React.useState('');
  const [contextDraft, setContextDraft] = React.useState('');
  const [renameDraft, setRenameDraft] = React.useState('');
  const [uploadFiles, setUploadFiles] = React.useState<File[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [savingContext, setSavingContext] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');

  const loadLibrary = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const nextLibraryItems = await API.listMediaLibrary();
      setLibraryItems(Array.isArray(nextLibraryItems) ? nextLibraryItems : []);
    } catch (error) {
      setErrorMessage(toActionableError(error, 'list'));
      setLibraryItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    const modeChangedWhileOpen = isOpen && lastModeRef.current !== mode;
    if (!isOpen) {
      wasOpenRef.current = false;
      lastModeRef.current = mode;
      return;
    }
    if (!justOpened && !modeChangedWhileOpen) return;

    setActiveTab(mode === 'manage' ? 'upload' : 'browse');
    setFolderType('all');
    setSourceFilter('all');
    setSearchQuery('');
    setSelectedIds(initialSelectedMediaIds);
    setActiveMediaId(initialSelectedMediaIds[0] || '');
    setContextDraft('');
    setRenameDraft('');
    setUploadFiles([]);
    setLibraryItems([]);
    setDismissedMediaIds([]);
    setStatusMessage('');
    setErrorMessage('');
    void loadLibrary();
    wasOpenRef.current = true;
    lastModeRef.current = mode;
  }, [initialSelectedMediaIds, isOpen, loadLibrary, mode]);

  const items = React.useMemo(
    () =>
      mergeLibraryItems(libraryItems, generatedAssets).filter(
        (item) => !dismissedMediaIds.includes(item.media_id || item.id)
      ),
    [dismissedMediaIds, generatedAssets, libraryItems]
  );

  const activeItem = React.useMemo(
    () => items.find((item) => (item.media_id || item.id) === activeMediaId) || null,
    [activeMediaId, items]
  );

  React.useEffect(() => {
    setContextDraft(readMediaContextDraft(activeItem));
    setRenameDraft(activeItem?.name || '');
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
        setErrorMessage(toActionableError(error, 'upload'));
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
      setLibraryItems((previous) => {
        const nextMetadata = { ...(activeItem.metadata || {}), user_context: contextDraft.trim() };
        const matchIndex = previous.findIndex((item) => (item.media_id || item.id) === mediaId);
        if (matchIndex >= 0) {
          return previous.map((item, index) =>
            index === matchIndex ? { ...item, metadata: nextMetadata } : item
          );
        }
        return [{ ...activeItem, metadata: nextMetadata }, ...previous];
      });
      setStatusMessage('Saved file context.');
    } catch (error) {
      setErrorMessage(toActionableError(error, 'metadata'));
    } finally {
      setSavingContext(false);
    }
  };

  const handleRenameActive = async () => {
    if (!activeItem || mode === 'select') return;
    const mediaId = (activeItem.media_id || activeItem.id || '').trim();
    const nextName = renameDraft.trim();
    if (!mediaId || !nextName) {
      setErrorMessage('Enter a file name before renaming.');
      return;
    }

    setRenaming(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const renamed = await API.renameMediaLibraryItem(mediaId, nextName);
      const nextMediaId = renamed.media_id || renamed.id || mediaId;
      setLibraryItems((previous) => {
        const nextItem = {
          ...activeItem,
          ...renamed,
          media_id: nextMediaId,
          id: nextMediaId,
          name: renamed.name || nextName,
        };
        const matchIndex = previous.findIndex((item) => (item.media_id || item.id) === mediaId);
        if (matchIndex >= 0) {
          return previous.map((item, index) => (index === matchIndex ? nextItem : item));
        }
        return [nextItem, ...previous];
      });
      setActiveMediaId(nextMediaId);
      setRenameDraft(renamed.name || nextName);
      setStatusMessage('Renamed file successfully.');
    } catch (error) {
      setErrorMessage(toActionableError(error, 'rename'));
    } finally {
      setRenaming(false);
    }
  };

  const handleRemoveActive = async () => {
    if (!activeItem || mode === 'select') return;
    const mediaId = (activeItem.media_id || activeItem.id || '').trim();
    if (!mediaId) return;

    setDeleting(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      await API.deleteMediaItem(mediaId);
      setLibraryItems((previous) => previous.filter((item) => (item.media_id || item.id) !== mediaId));
      setDismissedMediaIds((previous) =>
        previous.includes(mediaId) ? previous : [...previous, mediaId]
      );
      setSelectedIds((previous) => previous.filter((id) => id !== mediaId));
      setActiveMediaId('');
      setContextDraft('');
      setRenameDraft('');
      setStatusMessage('Removed file from library.');
    } catch (error) {
      setErrorMessage(toActionableError(error, 'remove'));
    } finally {
      setDeleting(false);
    }
  };

  return {
    activeItem,
    activeTab,
    contextDraft,
    renameDraft,
    errorMessage,
    filteredItems,
    folderCounts,
    folderType,
    loading,
    savingContext,
    renaming,
    deleting,
    searchQuery,
    selectedItems,
    selectedIds,
    sourceFilter,
    statusMessage,
    uploadFiles,
    uploading,
    setActiveTab,
    setContextDraft,
    setRenameDraft,
    setFolderType,
    setSearchQuery,
    setSourceFilter,
    setUploadFiles,
    handleFileClick,
    handleSaveContext,
    handleRenameActive,
    handleRemoveActive,
    handleUpload,
    loadLibrary,
  };
};
