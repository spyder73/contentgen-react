import { MediaType } from '../api/structs/media';

export interface MetadataFieldConfig {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'select' | 'select-media';
  placeholder?: string;
  description?: string;
  options?: string[];
}

export interface ClipStyleConfig {
  id: string;
  name: string;
  description: string;
  metadataFields: MetadataFieldConfig[];
  mediaMetadataFields: Record<string, MetadataFieldConfig[]>;
}