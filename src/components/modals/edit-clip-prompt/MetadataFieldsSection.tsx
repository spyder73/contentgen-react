import React from 'react';
import { AvailableMediaItem } from '../../../api/clip';
import { ClipStyleField, ClipStyleSchema } from '../../../api/clipstyleSchema';
import { Input, TextArea } from '../../ui';
import { extractMediaId, isMusicMedia, normalizeFrontText, toMediaOptionLabel, toStringValue } from './utils';

interface MetadataFieldsSectionProps {
  style: string;
  styleSchema?: ClipStyleSchema;
  metadata: Record<string, unknown>;
  metadataFields: ClipStyleField[];
  availableMedia: AvailableMediaItem[];
  isLoadingMedia: boolean;
  onMetadataChange: (key: string, value: unknown) => void;
}

const MetadataFieldsSection: React.FC<MetadataFieldsSectionProps> = ({
  style,
  styleSchema,
  metadata,
  metadataFields,
  availableMedia,
  isLoadingMedia,
  onMetadataChange,
}) => {
  if (metadataFields.length === 0) return null;

  const renderMetadataField = (field: ClipStyleField) => {
    const value = metadata[field.key] ?? field.defaultValue ?? '';
    const label = field.required ? `${field.label} *` : field.label;

    if (field.type === 'textarea') {
      const textValue = field.key === 'frontText' ? normalizeFrontText(value).join('\n') : String(value);
      return (
        <div key={field.key}>
          <label className="block text-xs uppercase tracking-wide text-zinc-400 mb-1">
            {label}
            {field.description && <span className="text-[10px] text-zinc-500 ml-2">({field.description})</span>}
          </label>
          <TextArea
            value={textValue}
            onChange={(event) => onMetadataChange(field.key, field.key === 'frontText' ? normalizeFrontText(event.target.value) : event.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.key}>
          <label className="block text-xs uppercase tracking-wide text-zinc-400 mb-1">{label}</label>
          <select value={String(value)} onChange={(event) => onMetadataChange(field.key, event.target.value)} className="w-full select">
            <option value="">Select...</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'select-media') {
      const selectedMediaId = extractMediaId(value);
      const preferMusic = field.key.toLowerCase().includes('music');
      const mediaOptions = (preferMusic ? availableMedia.filter(isMusicMedia) : availableMedia).map((item) => ({
        value: item.id,
        label: toMediaOptionLabel(item),
      }));

      return (
        <div key={field.key} className="space-y-2">
          <label className="block text-xs uppercase tracking-wide text-zinc-400 mb-1">{label}</label>
          {mediaOptions.length > 0 ? (
            <select
              value={selectedMediaId}
              onChange={(event) => onMetadataChange(field.key, event.target.value ? { media_id: event.target.value } : '')}
              className="w-full select"
            >
              <option value="">Select media...</option>
              {mediaOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          ) : (
            <Input
              value={selectedMediaId}
              onChange={(event) => onMetadataChange(field.key, event.target.value)}
              placeholder={field.placeholder || 'Media ID...'}
            />
          )}
          {isLoadingMedia && <p className="attachment-meta">Loading media catalog...</p>}
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <div key={field.key} className="flex items-center gap-2">
          <input
            id={`clip-field-${field.key}`}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onMetadataChange(field.key, event.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-700"
          />
          <label htmlFor={`clip-field-${field.key}`} className="text-sm text-slate-300">{label}</label>
        </div>
      );
    }

    return (
      <div key={field.key}>
        <label className="block text-xs uppercase tracking-wide text-zinc-400 mb-1">{label}</label>
        <Input
          type={field.type === 'number' ? 'number' : 'text'}
          value={toStringValue(value)}
          onChange={(event) => onMetadataChange(field.key, event.target.value)}
          placeholder={field.placeholder}
        />
      </div>
    );
  };

  return (
    <div className="space-y-3 pt-3 border-t border-white/10">
      <p className="text-xs uppercase tracking-[0.15em] text-white font-medium">{styleSchema?.name || style} Settings</p>
      {metadataFields.map(renderMetadataField)}
    </div>
  );
};

export default MetadataFieldsSection;
