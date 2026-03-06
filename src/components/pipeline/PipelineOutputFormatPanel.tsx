import React from 'react';
import { PipelineOutputFormat } from '../../api/structs';

interface PipelineOutputFormatPanelProps {
  value?: PipelineOutputFormat;
  onChange: (next: PipelineOutputFormat) => void;
}

const DEFAULT_FORMAT: PipelineOutputFormat = {
  enabled: true,
  aspect_ratio: '9:16',
  image_long_edge: 1920,
  video_long_edge: 1920,
};

const RATIO_OPTIONS = ['9:16', '4:5', '1:1', '16:9', '3:4', '4:3'];

const PipelineOutputFormatPanel: React.FC<PipelineOutputFormatPanelProps> = ({
  value,
  onChange,
}) => {
  const current = value || DEFAULT_FORMAT;

  const setField = <K extends keyof PipelineOutputFormat>(
    field: K,
    raw: PipelineOutputFormat[K]
  ) => {
    onChange({ ...current, [field]: raw });
  };

  const parseNumber = (value: string): number | undefined => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return undefined;
    }
    return parsed;
  };

  return (
    <div className="mt-3 rounded-lg border border-gray-700 p-3 bg-gray-900/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-300">Pipeline Output Format</p>
          <p className="text-xs text-gray-500">Keep image/video prompts on one aspect ratio</p>
        </div>
        <label className="text-xs text-gray-300 flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!current.enabled}
            onChange={(e) => setField('enabled', e.target.checked)}
            className="w-4 h-4 rounded bg-gray-700 border-gray-600"
          />
          Enabled
        </label>
      </div>

      {current.enabled && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Aspect Ratio</label>
            <select
              value={current.aspect_ratio || DEFAULT_FORMAT.aspect_ratio}
              onChange={(e) => setField('aspect_ratio', e.target.value)}
              className="w-full bg-gray-800 text-white px-2 py-1.5 rounded border border-gray-700 text-sm"
            >
              {RATIO_OPTIONS.map((ratio) => (
                <option key={ratio} value={ratio}>
                  {ratio}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Image Long Edge</label>
            <input
              type="number"
              min={128}
              max={4096}
              step={1}
              value={current.image_long_edge || ''}
              onChange={(e) => setField('image_long_edge', parseNumber(e.target.value))}
              className="w-full bg-gray-800 text-white px-2 py-1.5 rounded border border-gray-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Video Long Edge</label>
            <input
              type="number"
              min={128}
              max={4096}
              step={1}
              value={current.video_long_edge || ''}
              onChange={(e) => setField('video_long_edge', parseNumber(e.target.value))}
              className="w-full bg-gray-800 text-white px-2 py-1.5 rounded border border-gray-700 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineOutputFormatPanel;
