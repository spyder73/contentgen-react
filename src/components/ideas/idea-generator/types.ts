import { PipelineRun } from '../../../api/structs/pipeline';
import { AttachmentProvenanceItem } from '../../clips/attachmentProvenance';
import { SceneReferenceRow } from '../sceneReferenceMapping';

export interface IdeaGeneratorPanelProps {
  openLibrarySignal?: number;
  onIdeasCreated: () => void;
  onClipsCreated?: () => void;
}

export type ClipAssemblyStatus = 'pre_assembly' | 'assembling' | 'assembled' | 'error';

export interface ClipAssemblyDraft {
  id: string;
  title: string;
  promptJson: string;
  rows: SceneReferenceRow[];
  status: ClipAssemblyStatus;
  errorMessage?: string;
}

export interface RunAssemblyState {
  status: 'loading' | 'ready' | 'error';
  runProvenance: AttachmentProvenanceItem[];
  options: AttachmentProvenanceItem[];
  drafts: ClipAssemblyDraft[];
  loadError?: string;
}

export interface RunAssemblyById {
  [runId: string]: RunAssemblyState;
}

export type RunList = PipelineRun[];
