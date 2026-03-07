import React, { useCallback, useMemo, useState } from 'react';
import API from '../../../api/api';
import { AvailableMediaItem } from '../../../api/clip';
import { AssetPoolItem } from '../assetPool';
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

  React.useEffect(() => {
    let cancelled = false;

    API.getAvailableMedia()
      .then((items) => {
        if (cancelled) return;
        setAvailableMedia(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableMedia([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
    (files: File[]) => {
      if (files.length === 0) return;

      files.forEach((file) => {
        const inferredType =
          fileAttachmentType === 'auto' ? inferAttachmentTypeFromFile(file) : fileAttachmentType;

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
      });
    },
    [addAssetToPool, fileAttachmentType]
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
    addFilesAsAttachments(files);
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
    addFilesAsAttachments(files);
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
    handleAddUrlAttachment,
    handleFileInputChange,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};
