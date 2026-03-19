export interface SceneReferenceRow {
  key: string;
  scene_id: string;
  order: number;
  required: boolean;
  selectedOptionKey: string;
  error?: string;
}

export interface SceneReferenceMappingEntry {
  scene_id: string;
  order: number;
  required_reference: boolean;
  status: 'resolved' | 'missing';
  reference_media_id?: string;
  reference_id?: string;
  reference_name?: string;
  reference_type?: string;
  reference_url?: string;
  reference_source?: string;
  source_checkpoint_id?: string;
  source_checkpoint_name?: string;
  source_checkpoint_index?: number;
}

export interface SeedSceneRow {
  key: string;
  scene_id: string;
  order: number;
  required: boolean;
  reference?: import('../../clips/attachmentProvenance').AttachmentProvenanceItem;
}
