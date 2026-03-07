import React, { useState, useEffect } from 'react';
import { PromptTemplateEditorProps } from './types';
import { PromptTemplate } from '../../api/structs';

const PromptTemplateEditor: React.FC<PromptTemplateEditorProps> = ({
  template,
  isNew,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState({
    id: '',
    name: '',
    description: '',
    content: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setForm({
        id: template.id,
        name: template.name,
        description: template.description,
        content: template.content,
      });
    } else {
      setForm({ id: '', name: '', description: '', content: '' });
    }
  }, [template]);

  const handleSave = async () => {
    if (!form.id || !form.name || !form.content) {
      alert('ID, Name, and Content are required');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...form,
        version: template?.version || 1,
        created_at: template?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as PromptTemplate);
      onClose();
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const detectedPlaceholders = (form.content.match(/\{\{(\w+)\}\}/g) || []).filter(
    (value, index, all) => all.indexOf(value) === index
  );

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[220] p-4">
      <div className="bg-zinc-950 border border-white/20 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/60">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
            {isNew ? 'Create Prompt Template' : 'Edit Prompt Template'}
          </h3>
          <button onClick={onClose} className="btn btn-sm btn-ghost">Close</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">ID *</label>
              <input
                type="text"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                disabled={!isNew}
                className="input disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="my-prompt-template"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="My Prompt Template"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input"
              placeholder="Optional description..."
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
              Content * <span className="text-[10px] text-gray-500">Use {'{{placeholder}}'}</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full input font-mono h-56 resize-none"
              placeholder={`Enter your prompt template here...\n\nExample:\nYou are a creative assistant.\nGenerate content about: {{user_idea}}\n\nContext: {{context}}`}
            />
          </div>

          <div className="bg-black/50 border border-white/10 rounded p-3">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Detected placeholders</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {detectedPlaceholders.length > 0 ? (
                detectedPlaceholders.map((placeholder) => (
                  <code key={placeholder} className="bg-white/10 text-zinc-200 px-2 py-1 rounded text-xs">
                    {placeholder}
                  </code>
                ))
              ) : (
                <span className="text-xs text-gray-500 italic">
                  None detected. Add placeholders like {'{{user_input}}'}.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-white/10 bg-black/60">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button
            onClick={handleSave}
            disabled={isSaving || !form.id || !form.name || !form.content}
            className="btn btn-primary"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptTemplateEditor;
