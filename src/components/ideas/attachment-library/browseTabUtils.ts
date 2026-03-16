import { MediaLibraryItem } from '../../../api/media';

export const readGeneratedOriginLabel = (item: MediaLibraryItem): string => {
  const metadata = item.metadata || {};
  const originName = metadata.source_checkpoint_name;
  if (typeof originName === 'string' && originName.trim()) return originName.trim();
  const originId = metadata.source_checkpoint_id;
  if (typeof originId === 'string' && originId.trim()) return originId.trim();
  const originIndex = metadata.source_checkpoint_index;
  if (typeof originIndex === 'number' && Number.isFinite(originIndex)) {
    return `checkpoint ${originIndex + 1}`;
  }
  return '';
};
