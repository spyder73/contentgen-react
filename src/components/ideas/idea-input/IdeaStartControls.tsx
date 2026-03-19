import React from 'react';
import { Button, Select, TextArea } from '../../ui';
import { TemplateOption } from './types';

interface IdeaStartControlsProps {
  input: string;
  onInputChange: (value: string) => void;
  templateId: string;
  onTemplateChange: (value: string) => void;
  templateOptions: TemplateOption[];
  autoMode: boolean;
  onToggleAutoMode: () => void;
  loading: boolean;
  disabled?: boolean;
  submitDisabled: boolean;
  submitError?: string;
  showRequiredAssetWarning: boolean;
  onEnhance: () => void;
  enhancing: boolean;
}

const IdeaStartControls: React.FC<IdeaStartControlsProps> = ({
  input,
  onInputChange,
  templateId,
  onTemplateChange,
  templateOptions,
  autoMode,
  onToggleAutoMode,
  loading,
  disabled,
  submitDisabled,
  submitError,
  showRequiredAssetWarning,
  onEnhance,
  enhancing,
}) => (
  <>
    <div className="relative">
      <TextArea
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="Describe your video idea..."
        rows={3}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={onEnhance}
        disabled={disabled || enhancing || !input.trim()}
        title="Enhance prompt with AI"
        className={`
          absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
          ${enhancing
            ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40 cursor-wait'
            : 'bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/40 hover:text-violet-200'
          }
          ${(disabled || !input.trim()) ? 'opacity-40 cursor-not-allowed' : ''}
        `}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
        </svg>
        {enhancing ? 'Enhancing…' : 'Enhance'}
      </button>
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={templateId}
        onChange={(event) => onTemplateChange(event.target.value)}
        options={templateOptions}
        selectSize="sm"
        className="flex-1"
        placeholder="Select pipeline..."
        disabled={disabled}
      />

      <button
        type="button"
        onClick={onToggleAutoMode}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors
          ${
            autoMode
              ? 'bg-green-600/20 text-green-400 border border-green-600/50'
              : 'bg-slate-700 text-slate-400 border border-slate-600'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}
        `}
        title={autoMode ? 'Auto mode: Pipeline runs automatically' : 'Manual mode: Confirm each step'}
      >
        {autoMode ? 'Auto' : 'Manual'}
      </button>
      <Button type="submit" disabled={submitDisabled} loading={loading}>
        Generate
      </Button>
    </div>

    {!autoMode && (
      <p className="text-xs text-slate-500">Manual mode: You&apos;ll review and confirm each pipeline step</p>
    )}

    {submitError && <p className="text-xs text-rose-300">{submitError}</p>}

    {showRequiredAssetWarning && (
      <p className="text-xs text-amber-300">
        Required checkpoint assets are missing. Bind required items below before generating.
      </p>
    )}
  </>
);

export default IdeaStartControls;
