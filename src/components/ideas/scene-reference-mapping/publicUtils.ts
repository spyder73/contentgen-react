import { AttachmentProvenanceItem } from '../../clips/attachmentProvenance';
import {
  dedupeOptions,
  isReferenceCandidate,
  normalizeSource,
  toOptionFromAvailableMedia,
  toReferenceOptionKey,
} from './shared';

export { dedupeOptions, isReferenceCandidate, normalizeSource, toOptionFromAvailableMedia, toReferenceOptionKey };

export const getOptionKey = (item: AttachmentProvenanceItem): string => toReferenceOptionKey(item);
