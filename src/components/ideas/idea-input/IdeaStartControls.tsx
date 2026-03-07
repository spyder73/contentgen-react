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
}) => (
  <>
    <TextArea
      value={input}
      onChange={(event) => onInputChange(event.target.value)}
      placeholder="Describe your video idea..."
      rows={3}
      disabled={disabled}
    />

    <div className="flex items-center gap-3">
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
