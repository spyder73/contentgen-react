import React, { useState, useEffect } from 'react';
import Modal from '../modals/Modal';
import { Series, Character, Episode, createEpisode, updateEpisode, characterImageUrl } from '../../api/series';
import PipelineAPI from '../../api/pipeline';
import { PipelineTemplate, PipelineInputAttachment } from '../../api/structs/pipeline';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  series: Series;
  characters: Character[];
  episodes: Episode[];
  onStarted: (episode: Episode, runId: string) => void;
}

const GenerateEpisodeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  series,
  characters,
  episodes,
  onStarted,
}) => {
  const [title, setTitle] = useState('');
  const [idea, setIdea] = useState('');
  const [selectedCharIds, setSelectedCharIds] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState('');
  const [templates, setTemplates] = useState<PipelineTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    PipelineAPI.listPipelineTemplates()
      .then((t) => {
        setTemplates(t);
        if (t.length > 0 && !templateId) setTemplateId(t[0].id);
      })
      .catch(() => {});
  }, [isOpen, templateId]);

  useEffect(() => {
    if (isOpen) {
      // Pre-select all characters
      setSelectedCharIds(new Set(characters.map((c) => c.id)));
    }
  }, [isOpen, characters]);

  const toggleChar = (id: string) => {
    setSelectedCharIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStart = async () => {
    if (!idea.trim()) {
      setError('Please describe the episode idea');
      return;
    }
    if (!templateId) {
      setError('Please select a pipeline template');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedChars = characters.filter((c) => selectedCharIds.has(c.id));
      const prevEpisode = [...episodes].sort((a, b) => b.episode_number - a.episode_number)[0];
      const prevSynopsis = prevEpisode?.synopsis || prevEpisode?.title || null;

      // Compose initial_input
      const charBlock = selectedChars
        .map((c) => `${c.name}: ${c.description ?? 'No description'} (voice: ${c.voice ?? 'none'})`)
        .join('\n');
      const initialInput = [
        `Episode idea: ${idea.trim()}`,
        charBlock ? `Characters:\n${charBlock}` : '',
        `Previous episode summary: ${prevSynopsis ?? 'First episode'}`,
        `Series concept: ${series.concept}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      const episodeNumber = episodes.length + 1;

      // Create the episode record with status immediately
      const episode = await createEpisode({
        series_id: series.id,
        episode_number: episodeNumber,
        title: title.trim() || `Episode ${episodeNumber}`,
        synopsis: idea.trim(),
        metadata: {
          status: 'generating' as const,
          character_ids: selectedChars.map((c) => c.id),
          initial_context: initialInput,
        },
      });

      // Store prev summary for next episode
      const updatedEpisode = await updateEpisode(episode, {
        prev_episode_summary: prevSynopsis ?? '',
      });

      // Build character reference attachments (URL stored in metadata)
      const initialAttachments: PipelineInputAttachment[] = selectedChars
        .filter((c) => characterImageUrl(c))
        .map((c) => ({
          type: 'image',
          role: 'character_reference',
          url: characterImageUrl(c)!,
          name: c.name,
        }));

      // Start pipeline
      const startResponse = await PipelineAPI.startPipeline(templateId, initialInput, {
        autoMode: true,
        initialAttachments: initialAttachments.length > 0 ? initialAttachments : undefined,
      });

      // Store run_id in episode
      const finalEpisode = await updateEpisode(updatedEpisode, {
        metadata: {
          ...updatedEpisode.metadata,
          run_id: startResponse.run_id,
        },
      });

      onStarted(finalEpisode, startResponse.run_id);
      handleClose();
    } catch (err) {
      setError('Failed to start generation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setIdea('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate Episode" size="md">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Episode Title (optional)</label>
          <input
            className="input w-full"
            placeholder={`Episode ${episodes.length + 1}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Idea */}
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Episode Idea</label>
          <textarea
            className="input w-full resize-none"
            rows={4}
            placeholder="What happens in this episode? Key events, conflicts, tone…"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            autoFocus
          />
        </div>

        {/* Character selection */}
        {characters.length > 0 && (
          <div>
            <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Characters</label>
            <div className="flex flex-wrap gap-2">
              {characters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleChar(c.id)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border transition-colors ${
                    selectedCharIds.has(c.id)
                      ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300'
                      : 'border-white/20 bg-white/5 text-slate-400'
                  }`}
                >
                  {characterImageUrl(c) && (
                    <img src={characterImageUrl(c)} alt={c.name} className="w-4 h-4 rounded-full object-cover" />
                  )}
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pipeline selection */}
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Pipeline</label>
          <select
            className="input w-full"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            {templates.length === 0 && <option value="">No pipelines available</option>}
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button className="btn btn-ghost btn-sm" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleStart}
            disabled={loading || !templateId}
          >
            {loading ? 'Starting…' : 'Generate'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GenerateEpisodeModal;
