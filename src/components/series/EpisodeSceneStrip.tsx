import React from 'react';
import { PipelineRun } from '../../api/structs/pipeline';
import { constructMediaUrl } from '../../api/helpers';

interface Props {
  run: PipelineRun | null;
}

// Collect all image/video attachments from the pipeline run's completed checkpoints
function collectSceneThumbnails(run: PipelineRun): Array<{ url: string; name: string }> {
  const results: Array<{ url: string; name: string }> = [];
  for (const result of run.results) {
    if (!result.attachments) continue;
    for (const att of result.attachments) {
      if (!att.url) continue;
      const mime = att.mime_type ?? '';
      if (mime.startsWith('image/') || mime.startsWith('video/')) {
        results.push({ url: constructMediaUrl(att.url), name: att.name ?? att.filename ?? 'Scene' });
      }
    }
  }
  return results;
}

const EpisodeSceneStrip: React.FC<Props> = ({ run }) => {
  if (!run) {
    return <p className="text-slate-500 text-xs italic">No scenes available</p>;
  }

  const scenes = collectSceneThumbnails(run);

  if (scenes.length === 0) {
    return <p className="text-slate-500 text-xs italic">No scene thumbnails yet</p>;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
      {scenes.map((scene, i) => (
        <div key={i} className="flex-shrink-0 w-24 h-16 rounded overflow-hidden bg-black border border-white/10">
          <img
            src={scene.url}
            alt={scene.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
};

export default EpisodeSceneStrip;
