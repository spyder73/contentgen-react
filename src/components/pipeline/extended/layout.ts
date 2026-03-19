import { CheckpointConfig } from '../../../api/structs';

export type Lane = 'control' | 'text' | 'media';
export type BusFamily = 'source' | 'prompt' | 'media' | 'payload';

export const COLUMN_WIDTH = 210;
export const NODE_WIDTH = 184;
export const NODE_HEIGHT = 108;
export const CHECKPOINT_AREA_TOP = 76;
export const CHECKPOINT_AREA_HEIGHT = 228;
export const CHECKPOINT_ROW_Y = 110;
export const BUS_TOP = 352;
export const BUS_ROW = 46;

export const humanize = (value?: string) => (value || '').replace(/[-_]+/g, ' ').trim();

export const laneFor = (checkpoint: CheckpointConfig): Lane =>
  checkpoint.type === 'generator'
    ? 'media'
    : checkpoint.type === 'distributor' || checkpoint.type === 'connector'
      ? 'control'
      : 'text';

export const modelSummary = (checkpoint: CheckpointConfig) => {
  if (checkpoint.type === 'generator') return [checkpoint.generator?.provider, checkpoint.generator?.model].filter(Boolean).join(' / ');
  if (checkpoint.type === 'distributor') return [checkpoint.distributor?.provider, checkpoint.distributor?.model].filter(Boolean).join(' / ');
  if (checkpoint.type === 'prompt' || !checkpoint.type) return [checkpoint.promptGate?.provider, checkpoint.promptGate?.model].filter(Boolean).join(' / ');
  return '';
};

export const isMediaMapping = (key: string, source: string) =>
  /attachment|asset|media|image|reference|frame|seed/i.test(`${key} ${source}`);
