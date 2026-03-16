import React, { useCallback, useMemo, useState } from 'react';
import API from '../../../api/api';
import { AvailableMediaItem } from '../../../api/clip';
import { AssetPoolItem, mediaItemToPoolItem } from '../assetPool';
import { ensureKind, inferAttachmentTypeFromFile, isMusicMedia } from './helpers';
import { AttachmentType, FileAttachmentMode } from './types';
import { getHttpStatus, getInlineMediaError, mergeLibraryItems, replaceLibraryIfChanged, toNormalizedLibraryItem } from './assetPoolStateHelpers';

interface UseAssetPoolStateArgs {
  disabled?: boolean;
  onError?: (message: string) => void;
}

export const useAssetPoolState = ({ disabled, onError }: UseAssetPoolStateArgs) => {
  const [attachmentType, setAttachmentType] = useState<AttachmentType>('music');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [fileAttachmentType, setFileAttachmentType] = useState<FileAttachmentMode>('auto');
  const [assetPool, setAssetPool] = useState<AssetPoolItem[]>([]);
  const [availableMedia, setAvailableMedia] = useState<AvailableMediaItem[]>([]);
  const [musicMediaId, setMusicMediaId] = useState('');
  const [isAttachmentPoolExpanded, setIsAttachmentPoolExpanded] = useState(true);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [libraryError, setLibraryError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const registerFileInputRef = useCallback((node: HTMLInputElement | null) => { fileInputRef.current = node; }, []);
  const openFilePicker = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const replaceAvailableMedia = useCallback((items: AvailableMediaItem[]) => {
    setAvailableMedia((previous) => replaceLibraryIfChanged(previous, Array.isArray(items) ? items : []));
  }, []);

  const mergeAvailableMedia = useCallback((items: AvailableMediaItem[], options?: { prepend?: boolean }) => {
    if (!items.length) return;
    setAvailableMedia((previous) => mergeLibraryItems(previous, items, options));
  }, []);

  const loadAvailableMedia = useCallback(async () => {
    try {
      const libraryItems = await API.listMediaLibrary();
      const normalized = Array.isArray(libraryItems) ? libraryItems.map((item) => toNormalizedLibraryItem(item)) : [];
      replaceAvailableMedia(normalized);
      setLibraryError('');
    } catch (error) {
      replaceAvailableMedia([]);
      setLibraryError(getInlineMediaError(error, 'list'));
    }
  }, [replaceAvailableMedia]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await loadAvailableMedia();
      } catch {
        if (!cancelled) replaceAvailableMedia([]);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [loadAvailableMedia, replaceAvailableMedia]);

  const addAssetToPool = useCallback((asset: AssetPoolItem) => {
    setAssetPool((previous) => {
      if (previous.some((item) => item.id === asset.id)) return previous;
      return [asset, ...previous];
    });
  }, []);

  const removeAssetFromPool = (assetId: string) => setAssetPool((previous) => previous.filter((item) => item.id !== assetId));

  const addFilesAsAttachments = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploadingFiles(true);
    let usedLocalFallback = false;
    let latestUploadError = '';

    for (const file of files) {
      const inferredType = fileAttachmentType === 'auto' ? inferAttachmentTypeFromFile(file) : fileAttachmentType;
      try {
        const uploaded = await API.uploadMediaLibraryFile(file, { type: inferredType, source: 'manual_upload' });
        const normalized = toNormalizedLibraryItem(uploaded, {
          inferredType,
          fallbackName: file.name,
          fallbackSource: 'manual_upload',
          fallbackSize: file.size,
        });
        mergeAvailableMedia([normalized], { prepend: true });
        addAssetToPool(mediaItemToPoolItem(normalized));
        latestUploadError = '';
      } catch (error) {
        const status = getHttpStatus(error);
        latestUploadError = getInlineMediaError(error, 'upload');
        if (status === 405 || status === 413) continue;

        usedLocalFallback = true;
        addAssetToPool({
          id: `file:${file.name}:${file.lastModified}:${file.size}`,
          type: inferredType,
          kind: ensureKind(inferredType),
          source: 'file',
          name: file.name,
          mime_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
          metadata: { file_name: file.name, last_modified: file.lastModified },
        });
      }
    }

    setIsUploadingFiles(false);
    setUploadError(latestUploadError);
    if (usedLocalFallback) onError?.('Media-library upload is unavailable; files were added as local attachments.');
  }, [addAssetToPool, fileAttachmentType, mergeAvailableMedia, onError]);

  const handleAddUrlAttachment = () => {
    const trimmed = attachmentUrl.trim();
    if (!trimmed) return;
    try {
      const parsed = new URL(trimmed);
      const filename = parsed.pathname.split('/').pop() || parsed.host || 'remote-asset';
      const type = ensureKind(attachmentType);
      addAssetToPool({
        id: `url:${parsed.toString()}`,
        type,
        kind: type,
        source: 'url',
        url: parsed.toString(),
        name: filename,
        mime_type: 'application/octet-stream',
      });
      setAttachmentUrl('');
    } catch {
      onError?.('Please enter a valid URL before attaching.');
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadError('');
    void addFilesAsAttachments(files);
    event.target.value = '';
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) setIsDraggingFiles(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    event.dataTransfer.dropEffect = 'copy';
    setIsDraggingFiles(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    setIsDraggingFiles(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFiles(false);
    if (disabled) return;
    const files = Array.from(event.dataTransfer.files || []);
    setUploadError('');
    void addFilesAsAttachments(files);
  };

  const musicOptions = useMemo(() => availableMedia.filter(isMusicMedia).map((item) => ({ value: item.id, label: `${item.name} (${item.type})` })), [availableMedia]);
  const selectedMusic = useMemo(() => availableMedia.find((item) => item.id === musicMediaId) || null, [availableMedia, musicMediaId]);
  const assetPoolById = useMemo(() => new Map(assetPool.map((item) => [item.id, item])), [assetPool]);

  return {
    attachmentType,
    setAttachmentType,
    attachmentUrl,
    setAttachmentUrl,
    fileAttachmentType,
    setFileAttachmentType,
    assetPool,
    assetPoolById,
    addAssetToPool,
    removeAssetFromPool,
    availableMedia,
    musicMediaId,
    setMusicMediaId,
    musicOptions,
    selectedMusic,
    isAttachmentPoolExpanded,
    setIsAttachmentPoolExpanded,
    openFilePicker,
    registerFileInputRef,
    isDraggingFiles,
    isUploadingFiles,
    libraryError,
    uploadError,
    handleAddUrlAttachment,
    handleFileInputChange,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};
