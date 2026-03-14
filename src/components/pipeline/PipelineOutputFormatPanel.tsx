import React from 'react';
import { PipelineOutputFormat } from '../../api/structs';
import PipelineOutputSettingsModal from './PipelineOutputSettingsModal';
import { DEFAULT_OUTPUT_FORMAT, toStringValue } from './utils';

interface PipelineOutputFormatPanelProps {
  value?: PipelineOutputFormat;
  onChange: (next: PipelineOutputFormat) => void;
  requiresSeedCompatibleImageModel?: boolean;
}

type ModalType = 'image' | 'video' | 'audio' | null;

const PipelineOutputFormatPanel: React.FC<PipelineOutputFormatPanelProps> = ({
  value,
  onChange,
  requiresSeedCompatibleImageModel = false,
}) => {
  const [settingsModal, setSettingsModal] = React.useState<ModalType>(null);
  const current = { ...DEFAULT_OUTPUT_FORMAT, ...value };

  const setModalityDefaults = (
    prefix: 'image' | 'video' | 'audio',
    payload: {
      provider?: string;
      model?: string;
      settings?: Record<string, unknown>;
    }
  ) => {
    const providerKey = `${prefix}_provider` as const;
    const modelKey = `${prefix}_model` as const;
    const settingsKey = `${prefix}_settings` as const;

    onChange({
      ...current,
      [providerKey]: payload.provider,
      [modelKey]: payload.model,
      [settingsKey]: payload.settings,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-black/35 p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-white">
          Final Clip Generation Settings
        </h3>
        <p className="text-xs text-gray-500">
          Template-level defaults stamped into final clip prompt rows only. Generator checkpoints use their own checkpoint config.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="min-w-0 space-y-2">
          <label className="block text-xs uppercase tracking-wide text-gray-400">Image Defaults</label>
          <div className="rounded border border-white/10 bg-black/40 px-3 py-3 text-xs text-gray-400">
            <div>Provider: {toStringValue(current.image_provider) || 'none'}</div>
            <div className="mt-1 truncate">Model: {toStringValue(current.image_model) || 'none'}</div>
          </div>
          <button onClick={() => setSettingsModal('image')} className="btn btn-xs btn-ghost">
            Image Settings
          </button>
        </section>

        <section className="min-w-0 space-y-2">
          <label className="block text-xs uppercase tracking-wide text-gray-400">Video Defaults</label>
          <div className="rounded border border-white/10 bg-black/40 px-3 py-3 text-xs text-gray-400">
            <div>Provider: {toStringValue(current.video_provider) || 'none'}</div>
            <div className="mt-1 truncate">Model: {toStringValue(current.video_model) || 'none'}</div>
          </div>
          <button onClick={() => setSettingsModal('video')} className="btn btn-xs btn-ghost">
            Video Settings
          </button>
        </section>

        <section className="min-w-0 space-y-2">
          <label className="block text-xs uppercase tracking-wide text-gray-400">Audio Defaults</label>
          <div className="rounded border border-white/10 bg-black/40 px-3 py-3 text-xs text-gray-400">
            <div>Provider: {toStringValue(current.audio_provider) || 'none'}</div>
            <div className="mt-1 truncate">Model: {toStringValue(current.audio_model) || 'none'}</div>
          </div>
          <button onClick={() => setSettingsModal('audio')} className="btn btn-xs btn-ghost">
            Audio Settings
          </button>
        </section>
      </div>

      <PipelineOutputSettingsModal
        isOpen={settingsModal === 'image'}
        onClose={() => setSettingsModal(null)}
        modality="image"
        provider={toStringValue(current.image_provider)}
        model={toStringValue(current.image_model)}
        settings={current.image_settings || {}}
        requireSeedImageSupport={requiresSeedCompatibleImageModel}
        onApply={(payload) => {
          setModalityDefaults('image', payload);
          setSettingsModal(null);
        }}
      />

      <PipelineOutputSettingsModal
        isOpen={settingsModal === 'video'}
        onClose={() => setSettingsModal(null)}
        modality="video"
        provider={toStringValue(current.video_provider)}
        model={toStringValue(current.video_model)}
        settings={current.video_settings || {}}
        onApply={(payload) => {
          setModalityDefaults('video', payload);
          setSettingsModal(null);
        }}
      />

      <PipelineOutputSettingsModal
        isOpen={settingsModal === 'audio'}
        onClose={() => setSettingsModal(null)}
        modality="audio"
        provider={toStringValue(current.audio_provider)}
        model={toStringValue(current.audio_model)}
        settings={current.audio_settings || {}}
        onApply={(payload) => {
          setModalityDefaults('audio', payload);
          setSettingsModal(null);
        }}
      />
    </div>
  );
};

export default PipelineOutputFormatPanel;
