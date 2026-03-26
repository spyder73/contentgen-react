import React, { useState } from 'react';
import { MediaItem } from '../../api/structs/media';
import Modal from './Modal';
import { Button } from '../ui';
import API from '../../api/api';
import { useToast } from '../../hooks/useToast';

interface LipSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  clipId: string;
  video: MediaItem;
  audios: MediaItem[];
  onSuccess: () => void;
}

type Tab = 'audio' | 'speech';

const LipSyncModal: React.FC<LipSyncModalProps> = ({
  isOpen,
  onClose,
  clipId,
  video,
  audios,
  onSuccess,
}) => {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('speech');
  const [audioMediaId, setAudioMediaId] = useState('');
  const [text, setText] = useState<string>(
    typeof video.metadata?.subtitles === 'string' ? video.metadata.subtitles : ''
  );
  const [voice, setVoice] = useState('auto');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0.0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const readyAudios = audios.filter(
    (a) => a.type === 'audio' && a.file_url && !a.file_url.includes('_waiting') && !a.file_url.includes('_failed')
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (tab === 'audio') {
        if (!audioMediaId) {
          toast({ text: 'Select an audio clip', level: 'error' });
          setIsSubmitting(false);
          return;
        }
        await API.lipSyncMedia(clipId, video.id, { audio_media_id: audioMediaId });
      } else {
        if (!text.trim()) {
          toast({ text: 'Enter text to speak', level: 'error' });
          setIsSubmitting(false);
          return;
        }
        await API.lipSyncMedia(clipId, video.id, { text: text.trim(), voice, speed, pitch });
      }
      toast({ text: 'Lip sync started — new video will appear when ready', level: 'success' });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({ text: `Lip sync failed: ${error.message}`, level: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lip Sync" size="md">
      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <button
          type="button"
          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
            tab === 'speech'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
          onClick={() => setTab('speech')}
        >
          Text + Voice
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
            tab === 'audio'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
          onClick={() => setTab('audio')}
        >
          Use Audio Clip
        </button>
      </div>

      {tab === 'speech' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Dialogue text</label>
            <textarea
              className="w-full bg-slate-800 text-white text-sm rounded-md px-3 py-2 border border-white/10 focus:outline-none focus:border-white/30 resize-none"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What should the character say?"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Voice</label>
            <select
              className="w-full bg-slate-800 text-white text-sm rounded-md px-3 py-2 border border-white/10 focus:outline-none focus:border-white/30"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
            >
              <option value="auto">Auto</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">Speed ({speed.toFixed(1)}x)</label>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">Pitch ({pitch > 0 ? '+' : ''}{pitch})</label>
              <input
                type="range"
                min={-10}
                max={10}
                step={1}
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-white"
              />
            </div>
          </div>
        </div>
      )}

      {tab === 'audio' && (
        <div>
          <label className="block text-xs text-slate-400 mb-1">Audio clip</label>
          {readyAudios.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              No ready audio clips in this clip. Generate audio first or use Text + Voice tab.
            </p>
          ) : (
            <select
              className="w-full bg-slate-800 text-white text-sm rounded-md px-3 py-2 border border-white/10 focus:outline-none focus:border-white/30"
              value={audioMediaId}
              onChange={(e) => setAudioMediaId(e.target.value)}
            >
              <option value="">Select audio...</option>
              {readyAudios.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.prompt || a.id.slice(0, 8)}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-white/10 mt-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Starting...' : 'Start Lip Sync'}
        </Button>
      </div>
    </Modal>
  );
};

export default LipSyncModal;
