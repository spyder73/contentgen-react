import React from 'react';
import { CheckpointConfig } from '../../../api/structs';

interface InputMappingSectionProps {
  inputMapping: CheckpointConfig['input_mapping'];
  onChange: (key: string, value: string) => void;
  onRemove: (key: string) => void;
}

const InputMappingSection: React.FC<InputMappingSectionProps> = ({
  inputMapping,
  onChange,
  onRemove,
}) => {
  const [newMappingKey, setNewMappingKey] = React.useState('');

  const handleAdd = () => {
    const key = newMappingKey.trim();
    if (!key || inputMapping[key]) return;
    onChange(key, 'initial_input');
    setNewMappingKey('');
  };

  return (
    <section className="space-y-3 rounded-lg border border-white/10 bg-black/30 p-4">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-white">
          Input Mapping
        </h4>
        <p className="mt-1 text-xs text-gray-500">
          Map placeholders to `initial_input`, `checkpoint:&lt;id&gt;`, or attachment selectors.
        </p>
      </div>

      <div className="space-y-2">
        {Object.entries(inputMapping || {}).map(([key, value]) => (
          <div key={key} className="grid gap-2 md:grid-cols-[8rem_minmax(0,1fr)_auto]">
            <div className="rounded border border-white/10 bg-black/50 px-3 py-2 text-xs text-gray-300">
              {key}
            </div>
            <input
              type="text"
              value={value}
              onChange={(event) => onChange(key, event.target.value)}
              className="input w-full text-xs"
              placeholder="initial_input or checkpoint:scene-builder"
            />
            <button onClick={() => onRemove(key)} className="btn btn-sm btn-ghost">
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
        <input
          type="text"
          value={newMappingKey}
          onChange={(event) => setNewMappingKey(event.target.value)}
          className="input w-full text-xs"
          placeholder="New placeholder key"
        />
        <button onClick={handleAdd} className="btn btn-sm btn-ghost">
          Add Mapping
        </button>
      </div>
    </section>
  );
};

export default InputMappingSection;
