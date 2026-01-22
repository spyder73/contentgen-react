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

  const detectedPlaceholders = (form.content.match(/\{\{(\w+)\}\}/g) || [])
    .filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-600 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-750">
          <h3 className="text-lg font-semibold text-white">
            {isNew ? '✨ Create Prompt Template' : '✏️ Edit Prompt Template'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl px-2 hover:bg-gray-700 rounded"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">ID *</label>
              <input
                type="text"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                disabled={!isNew}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="my-prompt-template"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="My Prompt Template"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="Optional description..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Content *{' '}
              <span className="text-xs text-gray-500">
                (Use {`{{placeholder}}`} for variables)
              </span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm font-mono h-64 resize-none border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder={`Enter your prompt template here...\n\nExample:\nYou are a creative assistant.\nGenerate content about: {{user_idea}}\n\nContext: {{context}}`}
            />
          </div>

          {/* Placeholder Preview */}
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
            <span className="text-xs text-gray-500">Detected placeholders:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {detectedPlaceholders.length > 0 ? (
                detectedPlaceholders.map((placeholder) => (
                  <code
                    key={placeholder}
                    className="bg-yellow-900/50 text-yellow-400 px-2 py-1 rounded text-xs"
                  >
                    {placeholder}
                  </code>
                ))
              ) : (
                <span className="text-xs text-gray-500 italic">
                  None detected. Add placeholders like {`{{user_input}}`} to make your prompt dynamic.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-700 bg-gray-750">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !form.id || !form.name || !form.content}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptTemplateEditor;