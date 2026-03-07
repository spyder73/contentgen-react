import React, { useCallback, useMemo, useState } from 'react';
import API from '../../../api/api';
import { AvailableMediaItem } from '../../../api/clip';
import { AssetPoolItem, mediaItemToPoolItem } from '../assetPool';
import { ensureKind, inferAttachmentTypeFromFile, isMusicMedia } from './helpers';
import { AttachmentType, FileAttachmentMode } from './types';

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

  const replaceAvailableMedia = useCallback((items: AvailableMediaItem[]) => {
    setAvailableMedia((previous) => {
      const normalized = Array.isArray(items) ? items : [];
      if (
        previous.length === normalized.length &&
        previous.every(
          (item, index) =>
            item.id === normalized[index]?.id &&
            item.name === normalized[index]?.name &&
            item.type === normalized[index]?.type &&
            item.source === normalized[index]?.source
        )
      ) {
        return previous;
      }
      return normalized;
    });
  }, []);

  const mergeAvailableMedia = useCallback(
    (items: AvailableMediaItem[], options?: { prepend?: boolean }) => {
      if (!items.length) return;
      setAvailableMedia((previous) => {
        const ordered = options?.prepend ? [...items, ...previous] : [...previous, ...items];
        const seen = new Set<string>();
        return ordered.filter((item) => {
          if (!item.id || seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      });
    },
    []
  );

  const loadAvailableMedia = useCallback(async () => {
    try {
      const libraryItems = await API.listMediaLibrary();
      if (Array.isArray(libraryItems) && libraryItems.length > 0) {
        replaceAvailableMedia(
          libraryItems.map((item) => ({
            id: item.media_id || item.id,
            media_id: item.media_id || item.id,
            type: item.type || 'unknown',
            name: item.name || item.media_id || item.id,
            url: item.url,
            mime_type: item.mime_type,
            source: item.source,
            size_bytes: item.size_bytes,
            clip_id: item.clip_id,
            created_at: item.created_at,
            metadata: item.metadata,
          }))
        );
        return;
      }
    } catch {
      // Fallback to legacy available-media route while backend library endpoint rolls out.
    }

    try {
      const items = await API.getAvailableMedia();
      replaceAvailableMedia(Array.isArray(items) ? items : []);
    } catch {
      replaceAvailableMedia([]);
    }
  }, [replaceAvailableMedia]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await loadAvailableMedia();
      } catch {
        if (!cancelled) {
          replaceAvailableMedia([]);
        }
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

  const removeAssetFromPool = (assetId: string) => {
    setAssetPool((previous) => previous.filter((item) => item.id !== assetId));
  };

  const addFilesAsAttachments = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      setIsUploadingFiles(true);
      let usedLegacyFallback = false;

      for (const file of files) {
        const inferredType =
          fileAttachmentType === 'auto' ? inferAttachmentTypeFromFile(file) : fileAttachmentType;

        try {
          const uploaded = await API.uploadMediaLibraryFile(file, {
            type: inferredType,
            source: 'manual_upload',
          });
          const normalized: AvailableMediaItem = {
            id: uploaded.media_id || uploaded.id,
            media_id: uploaded.media_id || uploaded.id,
            type: uploaded.type || inferredType,
            name: uploaded.name || file.name,
            url: uploaded.url,
            mime_type: uploaded.mime_type || file.type || 'application/octet-stream',
            source: uploaded.source || 'manual_upload',
            size_bytes: uploaded.size_bytes ?? file.size,
            clip_id: uploaded.clip_id,
            created_at: uploaded.created_at,
            metadata: uploaded.metadata,
          };
          mergeAvailableMedia([normalized], { prepend: true });
          addAssetToPool(mediaItemToPoolItem(normalized));
        } catch {
          usedLegacyFallback = true;
          addAssetToPool({
            id: `file:${file.name}:${file.lastModified}:${file.size}`,
            type: inferredType,
            kind: ensureKind(inferredType),
            source: 'file',
            name: file.name,
            mime_type: file.type || 'application/octet-stream',
            size_bytes: file.size,
            metadata: {
              file_name: file.name,
              last_modified: file.lastModified,
            },
          });
        }
      }

      setIsUploadingFiles(false);
      if (usedLegacyFallback) {
        onError?.('Media-library upload is unavailable; files were added as local attachments.');
      }
    },
    [addAssetToPool, fileAttachmentType, mergeAvailableMedia, onError]
  );

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
    void addFilesAsAttachments(files);
    event.target.value = '';
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    setIsDraggingFiles(true);
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
    void addFilesAsAttachments(files);
  };

  const musicOptions = useMemo(
    () =>
      availableMedia.filter(isMusicMedia).map((item) => ({
        value: item.id,
        label: `${item.name} (${item.type})`,
      })),
    [availableMedia]
  );

  const selectedMusic = useMemo(
    () => availableMedia.find((item) => item.id === musicMediaId) || null,
    [availableMedia, musicMediaId]
  );

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
    isDraggingFiles,
    isUploadingFiles,
    handleAddUrlAttachment,
    handleFileInputChange,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};
