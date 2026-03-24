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

const PAGE_SIZE = 20;

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

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const loadLibrary = React.useCallback(async (page = 1, search = '') => {
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await API.listMediaLibraryPaged({ page, limit: PAGE_SIZE, search: search || undefined });
      setLibraryItems(Array.isArray(result.items) ? result.items : []);
      setTotalItems(result.total ?? result.items.length);
      setCurrentPage(result.page ?? page);
    } catch (error) {
      setErrorMessage(toActionableError(error, 'list'));
      setLibraryItems([]);
      setTotalItems(0);
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
    setCurrentPage(1);
    setTotalItems(0);
    void loadLibrary(1, '');
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
    () => filterLibraryItems(items, folderType, sourceFilter, ''),
    [folderType, items, sourceFilter]
  );

  const folderCounts = React.useMemo(() => countItemsByFolder(items), [items]);

  const selectedItems = React.useMemo(() => selectMediaItems(items, selectedIds), [items, selectedIds]);

  const handleSearchSubmit = React.useCallback((query: string) => {
    setCurrentPage(1);
    void loadLibrary(1, query);
  }, [loadLibrary]);

  const handlePageChange = React.useCallback((page: number) => {
    void loadLibrary(page, searchQuery);
  }, [loadLibrary, searchQuery]);

  const handleFileClick = async (mediaId: string) => {
    setActiveMediaId(mediaId);
    if (mode !== 'select') {
      // Fetch full item details from DB if not already in list.
      const existing = items.find((item) => (item.media_id || item.id) === mediaId);
      if (!existing) {
        try {
          const fetched = await API.getMediaItem(mediaId);
          if (fetched) {
            setLibraryItems((prev) => {
              if (prev.some((item) => (item.media_id || item.id) === mediaId)) return prev;
              return [fetched as MediaLibraryItem, ...prev];
            });
          }
        } catch {
          // ignore fetch errors — the item may still show partial info
        }
      }
      return;
    }
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
      await loadLibrary(1, searchQuery);
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
    currentPage,
    totalPages,
    totalItems,
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
    handleSearchSubmit,
    handlePageChange,
    loadLibrary,
  };
};
