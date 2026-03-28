import React from 'react';

interface FlagsSectionProps {
  requiresConfirm: boolean;
  allowRegenerate: boolean;
  onChange: (field: 'requires_confirm' | 'allow_regenerate', value: boolean) => void;
}

const FlagsSection: React.FC<FlagsSectionProps> = ({
  requiresConfirm,
  allowRegenerate,
  onChange,
}) => (
  <section className="space-y-3 rounded-lg border border-white/10 bg-black/30 p-4">
    <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-white">Flags</h4>
    <div className="grid gap-3 md:grid-cols-2">
      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={requiresConfirm}
          onChange={(event) => onChange('requires_confirm', event.target.checked)}
        />
        Requires Confirmation
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={allowRegenerate}
          onChange={(event) => onChange('allow_regenerate', event.target.checked)}
        />
        Allow Regenerate
      </label>
    </div>
  </section>
);

export default FlagsSection;
