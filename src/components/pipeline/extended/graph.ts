import { CheckpointConfig } from '../../../api/structs';
import { BUS_ROW, BUS_TOP, BusFamily, CHECKPOINT_ROW_Y, humanize, laneFor, Lane, modelSummary, NODE_HEIGHT, NODE_WIDTH } from './layout';

export interface GraphAnchor { id: string; title: string; subtitle?: string; kind: 'source'; x: number; y: number; width: number; height: number; lane: Lane; }
export interface GraphPort { id: string; key: string; source: string; }
export interface GraphNode { checkpoint: CheckpointConfig; lane: Lane; x: number; y: number; width: number; height: number; modelSummary: string; outputLabel: string; inputPorts: GraphPort[]; isSecondary: boolean; }
export interface GraphMarker { id: string; checkpointId?: string; x: number; kind: 'spawn' | 'read'; }
export interface GraphBus { id: string; title: string; family: BusFamily; sourceId: string; sourceKind: 'anchor' | 'node'; y: number; fromX: number; toX: number; markers: GraphMarker[]; }
export interface PipelineGraph { anchors: GraphAnchor[]; nodes: GraphNode[]; buses: GraphBus[]; width: number; height: number; busTop: number; }

const sourceId = (source: string) => source.replace(/^attachments:|^checkpoint:/, '').split(/[?.]/)[0];
const outputLabel = (checkpoint: CheckpointConfig, consumerKeys: string[], attachmentKeys: string[]) => {
  if (checkpoint.type === 'generator') return humanize(checkpoint.generator?.role || `${checkpoint.generator?.media_type || 'media'} output`);
  if (/payload|assembly/i.test(checkpoint.name)) return /final/i.test(checkpoint.name) ? 'final clip payload' : 'video payload';
  if (/intro/i.test(checkpoint.name)) return 'intro payload';
  if (checkpoint.type === 'distributor') return 'scene items';
  if (checkpoint.type === 'connector') return 'collected results';
  if (attachmentKeys[0]) return humanize(attachmentKeys[0]);
  return consumerKeys.includes('prompt') || checkpoint.type === 'prompt' ? 'prompt text' : humanize(consumerKeys[0] || 'checkpoint output');
};
const familyFor = (checkpoint: CheckpointConfig, consumerKeys: string[], attachmentKeys: string[]): BusFamily =>
  checkpoint.id === 'initial_input' ? 'source'
    : checkpoint.type === 'generator' || attachmentKeys.length || checkpoint.required_assets?.length ? 'media'
      : /payload|assembly|intro/i.test(checkpoint.name) || consumerKeys.some((key) => /payload|response|video|intro/i.test(key)) ? 'payload'
        : 'prompt';
const implicitAssetSource = (checkpoints: CheckpointConfig[], checkpointIndex: number, assetKey?: string) => {
  if (!assetKey) return null;
  for (let index = checkpointIndex - 1; index >= 0; index -= 1) if (checkpoints[index].generator?.role === assetKey) return checkpoints[index].id;
  return null;
};

export const buildPipelineGraph = (checkpoints: CheckpointConfig[]): PipelineGraph => {
  const consumerKeys = new Map<string, string[]>(); const attachmentKeys = new Map<string, string[]>();
  checkpoints.forEach((checkpoint) => {
    Object.entries(checkpoint.input_mapping || {}).forEach(([key, source]) => {
      if (source.startsWith('checkpoint:')) consumerKeys.set(sourceId(source), [...(consumerKeys.get(sourceId(source)) || []), key]);
      if (source.startsWith('attachments:')) attachmentKeys.set(sourceId(source), [...(attachmentKeys.get(sourceId(source)) || []), key]);
    });
    if (checkpoint.connector?.source_checkpoint_id) consumerKeys.set(checkpoint.connector.source_checkpoint_id, [...(consumerKeys.get(checkpoint.connector.source_checkpoint_id) || []), 'connector']);
  });

  const anchors: GraphAnchor[] = [{ id: 'initial_input', title: 'Initial Input', subtitle: checkpoints.flatMap((checkpoint) => Object.entries(checkpoint.input_mapping || {}).filter(([, source]) => source === 'initial_input').map(([key]) => `{${key}}`))[0], kind: 'source', x: 32, y: CHECKPOINT_ROW_Y + 10, width: 132, height: 72, lane: 'text' }];
  let nextX = 206;
  const nodes = checkpoints.map((checkpoint) => {
    const width = checkpoint.type === 'connector' ? 150 : checkpoint.type === 'distributor' ? NODE_WIDTH + 12 : NODE_WIDTH;
    const node = {
      checkpoint,
      lane: laneFor(checkpoint),
      x: nextX,
      y: CHECKPOINT_ROW_Y,
      width,
      height: NODE_HEIGHT,
      modelSummary: modelSummary(checkpoint),
      outputLabel: outputLabel(checkpoint, consumerKeys.get(checkpoint.id) || [], attachmentKeys.get(checkpoint.id) || []),
      inputPorts: Object.entries(checkpoint.input_mapping || {}).map(([key, source]) => ({ id: `${checkpoint.id}:${key}`, key, source })),
      isSecondary: checkpoint.type === 'connector' && !(consumerKeys.get(checkpoint.id) || []).length,
    };
    nextX += width + (checkpoint.type === 'connector' ? 18 : 34);
    return node;
  });

  const nodeCenterX = new Map(nodes.map((node) => [node.checkpoint.id, node.x + node.width / 2])); const anchorCenterX = new Map(anchors.map((anchor) => [anchor.id, anchor.x + anchor.width / 2]));
  const buses = new Map<string, GraphBus>();
  const ensureBus = (id: string, title: string, family: BusFamily, sourceKind: 'anchor' | 'node', sourceX: number) => {
    if (!buses.has(id)) buses.set(id, { id, title, family, sourceId: id, sourceKind, y: 0, fromX: sourceX, toX: sourceX + 160, markers: [{ id: `${id}:spawn`, x: sourceX, kind: 'spawn' }] });
    return buses.get(id)!;
  };

  ensureBus('initial_input', 'initial input', 'source', 'anchor', anchorCenterX.get('initial_input') || 114);
  nodes.forEach((node, checkpointIndex) => {
    const family = familyFor(node.checkpoint, consumerKeys.get(node.checkpoint.id) || [], attachmentKeys.get(node.checkpoint.id) || []);
    const sourceBus = ensureBus(node.checkpoint.id, node.outputLabel, family, 'node', nodeCenterX.get(node.checkpoint.id) || node.x + node.width / 2);
    let shouldKeep = /media|payload|prompt/.test(family) && (node.checkpoint.type === 'generator' || (consumerKeys.get(node.checkpoint.id) || []).length > 0 || (attachmentKeys.get(node.checkpoint.id) || []).length > 0 || /payload|final/i.test(node.outputLabel));
    Object.entries(node.checkpoint.input_mapping || {}).forEach(([key, source]) => {
      const refId = source === 'initial_input' ? 'initial_input' : source.startsWith('checkpoint:') || source.startsWith('attachments:') ? sourceId(source) : null;
      if (!refId) return;
      const sourceNode = nodes.find((candidate) => candidate.checkpoint.id === refId);
      const bus = ensureBus(refId, refId === 'initial_input' ? 'initial input' : sourceNode?.outputLabel || humanize(key), refId === 'initial_input' ? 'source' : familyFor(sourceNode?.checkpoint || node.checkpoint, consumerKeys.get(refId) || [], attachmentKeys.get(refId) || []), refId === 'initial_input' ? 'anchor' : 'node', refId === 'initial_input' ? (anchorCenterX.get(refId) || 114) : (nodeCenterX.get(refId) || 0));
      bus.markers.push({ id: `${refId}:${node.checkpoint.id}:${key}`, checkpointId: node.checkpoint.id, x: node.x + node.width / 2, kind: 'read' });
      bus.toX = Math.max(bus.toX, node.x + node.width / 2 + 36); shouldKeep = true;
    });
    node.checkpoint.required_assets?.forEach((asset, assetIndex) => {
      const refId = asset.checkpoint_id || implicitAssetSource(checkpoints, checkpointIndex, asset.key);
      if (!refId) return;
      const bus = ensureBus(refId, nodes.find((candidate) => candidate.checkpoint.id === refId)?.outputLabel || humanize(asset.key || asset.type || 'media'), 'media', 'node', nodeCenterX.get(refId) || 0);
      bus.markers.push({ id: `${refId}:${node.checkpoint.id}:asset:${assetIndex}`, checkpointId: node.checkpoint.id, x: node.x + node.width / 2, kind: 'read' });
      bus.toX = Math.max(bus.toX, node.x + node.width / 2 + 36); shouldKeep = true;
    });
    if (!shouldKeep) buses.delete(node.checkpoint.id);
    sourceBus.toX = Math.max(sourceBus.toX, sourceBus.fromX + 120);
  });

  const visibleBuses = Array.from(buses.values()).filter((bus) => bus.markers.length > 1 || bus.family === 'payload').sort((left, right) => {
    const familyOrder = { source: 0, prompt: 1, media: 2, payload: 3 };
    return familyOrder[left.family] - familyOrder[right.family] || left.fromX - right.fromX;
  }).map((bus, index) => ({ ...bus, y: BUS_TOP + index * BUS_ROW }));

  return { anchors, nodes, buses: visibleBuses, width: Math.max(1280, ...nodes.map((node) => node.x + node.width + 120)), height: BUS_TOP + visibleBuses.length * BUS_ROW + 88, busTop: BUS_TOP };
};
