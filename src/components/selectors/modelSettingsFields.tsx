import React from 'react';
import { ConstraintField } from '../../api/structs/model';
import { getFieldLabel, clampToConstraint } from './modelSettingsHelpers';

// ==================== Field Renderers ====================

interface FieldProps {
  fieldKey: string;
  field: ConstraintField;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
}

/**
 * Renders a single constraint field as the appropriate input type.
 */
export const ConstraintFieldInput: React.FC<FieldProps> = ({
  fieldKey,
  field,
  value,
  onChange,
}) => {
  const label = getFieldLabel(fieldKey);

  // Enum → dropdown
  if (field.enum && field.enum.length > 0) {
    const enumLabels = (field as Record<string, unknown>).enum_labels as
      | Record<string, string>
      | undefined;

    return (
      <div className={fieldKey === 'dimensions' ? 'col-span-2' : ''}>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          {label}
        </label>
        <select
          className="input text-sm"
          value={String(value ?? '')}
          onChange={(e) => {
            const raw = e.target.value;
            if (field.type === 'number' || field.type === 'integer') {
              onChange(fieldKey, Number(raw));
            } else if (field.type === 'boolean') {
              onChange(fieldKey, raw === 'true');
            } else {
              onChange(fieldKey, raw);
            }
          }}
        >
          {field.enum.map((opt) => (
            <option key={String(opt)} value={String(opt)}>
              {enumLabels?.[String(opt)] ?? String(opt)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Boolean → checkbox
  if (field.type === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          className="rounded bg-slate-700 border-slate-600 text-emerald-500"
          checked={Boolean(value)}
          onChange={(e) => onChange(fieldKey, e.target.checked)}
        />
        <label className="text-xs font-medium text-slate-400">{label}</label>
      </div>
    );
  }

  // Number / Integer → number input with range info
  if (field.type === 'number' || field.type === 'integer') {
    const numValue = typeof value === 'number' ? value : (field.default as number) ?? field.min ?? 0;

    const rangeText = [
      field.min !== undefined ? `min: ${field.min}` : null,
      field.max !== undefined ? `max: ${field.max}` : null,
    ]
      .filter(Boolean)
      .join(', ');

    return (
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          {label}
          {rangeText && (
            <span className="text-slate-600 ml-1">({rangeText})</span>
          )}
        </label>
        <input
          type="number"
          className="input text-sm"
          value={numValue}
          min={field.min}
          max={field.max}
          step={field.type === 'integer' ? 1 : 0.1}
          onChange={(e) => {
            const raw = parseFloat(e.target.value);
            if (isNaN(raw)) return;
            onChange(fieldKey, clampToConstraint(raw, field));
          }}
        />
      </div>
    );
  }

  // String → text input
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">
        {label}
      </label>
      <input
        type="text"
        className="input text-sm"
        value={String(value ?? '')}
        onChange={(e) => onChange(fieldKey, e.target.value)}
      />
    </div>
  );
};
