import { CheckpointInjectionMode } from '../../../api/structs/pipeline';

/**
 * Per-checkpoint interaction state, pre-resolved from the `Record<number, T>` maps
 * in useCheckpointListControls so that CheckpointCard doesn't need to do index lookups.
 */
export interface CheckpointInteractionState {
  selectedAssetId: string;
  setSelectedAssetId: (id: string) => void;
  attachLoading: boolean;
  attachError: string;
  injectText: string;
  setInjectText: (text: string) => void;
  injectMode: CheckpointInjectionMode;
  setInjectMode: (mode: CheckpointInjectionMode) => void;
  injectLoading: boolean;
  injectError: string;
  setInjectError: (error: string) => void;
  progressionLoading: boolean;
  progressionError: string;
  requiredReferencePrompt: string;
}
