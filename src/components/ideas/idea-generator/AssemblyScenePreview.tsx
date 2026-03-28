import React, { useState } from 'react';

interface ScenePromptEntry {
  text: string;
  referenceImageUrl?: string;
}

interface SceneGroup {
  sceneId: string;
  label: string;
  referenceImageUrl?: string;
  prompts: ScenePromptEntry[];
}

interface AudioEntry {
  text: string;
}

interface AssemblyScenePreviewProps {
  payload: Record<string, unknown> | null;
}

const readString = (v: unknown): string => (typeof v === 'string' ? v : '');

const extractText = (prompt: unknown): string => {
  if (typeof prompt === 'string') return prompt;
  if (prompt && typeof prompt === 'object') {
    const p = prompt as Record<string, unknown>;
    return readString(p.prompt) || readString(p.text) || readString(p.content) || '';
  }
  return '';
};

const extractSceneId = (prompt: unknown): string => {
  if (prompt && typeof prompt === 'object') {
    const p = prompt as Record<string, unknown>;
    if (p.metadata && typeof p.metadata === 'object') {
      return readString((p.metadata as Record<string, unknown>).scene_id);
    }
    return readString(p.scene_id);
  }
  return '';
};

const extractReferenceImages = (prompt: unknown): string[] => {
  if (prompt && typeof prompt === 'object') {
    const p = prompt as Record<string, unknown>;
    const refs = p.reference_images ?? (p.metadata && typeof p.metadata === 'object' ? (p.metadata as Record<string, unknown>).reference_images : undefined);
    if (Array.isArray(refs)) {
      return refs.map((r) => readString(typeof r === 'string' ? r : (r as Record<string, unknown>)?.url)).filter(Boolean);
    }
  }
  return [];
};

const buildSceneGroups = (payload: Record<string, unknown>): { scenes: SceneGroup[]; audio: AudioEntry[] } => {
  const videoPrompts = [
    ...(Array.isArray(payload.aiVideoPrompts) ? payload.aiVideoPrompts : []),
    ...(Array.isArray(payload.ai_video_prompts) ? payload.ai_video_prompts : []),
  ];
  const imagePrompts = [
    ...(Array.isArray(payload.imagePrompts) ? payload.imagePrompts : []),
    ...(Array.isArray(payload.image_prompts) ? payload.image_prompts : []),
  ];
  const audioPrompts = [
    ...(Array.isArray(payload.audioPrompts) ? payload.audioPrompts : []),
    ...(Array.isArray(payload.audio_prompts) ? payload.audio_prompts : []),
  ];

  const metadata = payload.metadata && typeof payload.metadata === 'object'
    ? payload.metadata as Record<string, unknown>
    : {};

  const sceneReferenceMapping: Array<Record<string, unknown>> = Array.isArray(metadata.scene_reference_mapping)
    ? metadata.scene_reference_mapping as Array<Record<string, unknown>>
    : [];

  const refBySceneId = new Map<string, string>();
  sceneReferenceMapping.forEach((entry) => {
    const sid = readString(entry.scene_id);
    const url = readString(entry.reference_url);
    if (sid && url) refBySceneId.set(sid, url);
  });

  const sceneMap = new Map<string, SceneGroup>();
  const sceneOrder: string[] = [];

  const addPrompt = (prompt: unknown, fallbackIndex: number) => {
    const text = extractText(prompt);
    if (!text) return;
    let sceneId = extractSceneId(prompt);
    if (!sceneId) sceneId = `__pos_${fallbackIndex}`;
    const refImages = extractReferenceImages(prompt);
    const refUrl = refBySceneId.get(sceneId) || refImages[0];

    if (!sceneMap.has(sceneId)) {
      const label = sceneId.startsWith('__pos_')
        ? `Scene ${sceneOrder.length + 1}`
        : `Scene ${sceneId}`;
      sceneMap.set(sceneId, { sceneId, label, referenceImageUrl: refUrl, prompts: [] });
      sceneOrder.push(sceneId);
    }
    const group = sceneMap.get(sceneId)!;
    if (!group.referenceImageUrl && refUrl) group.referenceImageUrl = refUrl;
    group.prompts.push({ text, referenceImageUrl: refImages[0] });
  };

  [...videoPrompts, ...imagePrompts].forEach((p, i) => addPrompt(p, i));

  // If no scene grouping at all, fall back to positional
  const scenes = sceneOrder.map((id) => sceneMap.get(id)!);

  const audio: AudioEntry[] = audioPrompts
    .map((p) => ({ text: extractText(p) }))
    .filter((a) => Boolean(a.text));

  return { scenes, audio };
};

const SceneCard: React.FC<{ group: SceneGroup }> = ({ group }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded border border-white/10 bg-black/30 p-2 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-200 font-medium">{group.label}</span>
        {group.prompts.length > 0 && (
          <button
            type="button"
            className="text-[10px] text-zinc-500 hover:text-zinc-300 uppercase tracking-wide transition-colors flex-shrink-0"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Hide Prompt' : 'See Prompt'}
          </button>
        )}
      </div>
      {group.referenceImageUrl && (
        <img
          src={group.referenceImageUrl}
          alt={group.label}
          className="w-full max-h-44 object-contain rounded border border-white/15 bg-black/40"
          loading="lazy"
        />
      )}
      {expanded && group.prompts.map((p, i) => (
        <p key={i} className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{p.text}</p>
      ))}
    </div>
  );
};

const AssemblyScenePreview: React.FC<AssemblyScenePreviewProps> = ({ payload }) => {
  if (!payload) return null;

  const { scenes, audio } = buildSceneGroups(payload);

  return (
    <div className="space-y-2">
      {scenes.length === 0 && audio.length === 0 ? (
        <p className="attachment-meta">No scene prompts found in this payload.</p>
      ) : (
        <>
          {scenes.map((group) => (
            <SceneCard key={group.sceneId} group={group} />
          ))}
          {audio.length > 0 && (
            <AudioRow entries={audio} />
          )}
        </>
      )}
    </div>
  );
};

const AudioRow: React.FC<{ entries: AudioEntry[] }> = ({ entries }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded border border-white/10 bg-black/30 p-2 space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-200 font-medium">Audio</span>
        <button
          type="button"
          className="text-[10px] text-zinc-500 hover:text-zinc-300 uppercase tracking-wide transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Hide Prompt' : 'See Prompt'}
        </button>
      </div>
      {expanded && entries.map((a, i) => (
        <p key={i} className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{a.text}</p>
      ))}
    </div>
  );
};

export default AssemblyScenePreview;
