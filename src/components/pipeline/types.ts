import { 
  PipelineTemplate, 
  PromptTemplate, 
  CheckpointConfig 
} from '../../api/structs';

export interface PipelineManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface PipelineListProps {
  pipelines: PipelineTemplate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export interface PipelineEditorProps {
  pipeline: PipelineTemplate;
  promptTemplates: PromptTemplate[];
  onSave: (pipeline: PipelineTemplate) => Promise<void>;
  onEditPrompt: (promptId: string) => void;
}

export interface CheckpointEditorProps {
  checkpoint: CheckpointConfig;
  index: number;
  promptTemplates: PromptTemplate[];
  onUpdate: (checkpoint: CheckpointConfig) => void;
  onRemove: () => void;
  onEditPrompt: (promptId: string) => void;
}

export interface PromptTemplateEditorProps {
  template: PromptTemplate | null;
  isNew: boolean;
  onSave: (template: PromptTemplate) => Promise<void>;
  onClose: () => void;
}