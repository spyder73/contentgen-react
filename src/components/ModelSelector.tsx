import React, { useEffect, useState } from 'react';
import API, { AIModel } from '../api/api';

export type Provider = 'openrouter' | 'google';

interface ModelSelectorProps {
  provider: Provider;
  model: string;
  onProviderChange: (provider: Provider) => void;
  onModelChange: (model: string) => void;
}

const formatPrice = (price: string | undefined): string => {
  if (!price) return '?';
  const perMillion = parseFloat(price) * 1000000;
  if (perMillion < 1) return `$${perMillion.toFixed(2)}`;
  return `$${perMillion.toFixed(0)}`;
};

const ModelSelector: React.FC<ModelSelectorProps> = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
}) => {
  const [recommendedModels, setRecommendedModels] = useState<AIModel[]>([]);
  const [allModels, setAllModels] = useState<AIModel[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const response = await API.getModels();
        const textModels = (response.all || []).filter(m => !m.architecture?.output_modalities?.includes('image'));
        const recommendedTextModels = (response.recommended || []).filter(m => !m.architecture?.output_modalities?.includes('image'));
        setRecommendedModels(recommendedTextModels);
        setAllModels(textModels);
        if (!model && recommendedTextModels?.length > 0) {
          onModelChange(recommendedTextModels[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  const selectedModel = [...recommendedModels, ...allModels].find(m => m.id === model);

  // Filter out recommended from all models, then filter by search
  const recommendedIds = new Set(recommendedModels.map(m => m.id));
  const otherModels = allModels.filter(m => !recommendedIds.has(m.id));
  
  const filteredOtherModels = searchTerm
    ? otherModels.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : otherModels;

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="text-slate-400 text-sm mb-2">AI Provider</div>

      {/* Provider Toggle */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => onProviderChange('google')}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
            provider === 'google'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          🔮 Gemini
        </button>
        <button
          onClick={() => onProviderChange('openrouter')}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
            provider === 'openrouter'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          🌐 OpenRouter
        </button>
      </div>

      {/* Model Selector (OpenRouter only) */}
      {provider === 'openrouter' && (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 bg-slate-700 rounded text-left flex items-center justify-between hover:bg-slate-600 transition-colors"
          >
            <div className="flex-1 min-w-0">
              {loading ? (
                <span className="text-slate-400">Loading...</span>
              ) : selectedModel ? (
                <div className="flex items-center justify-between">
                  <span className="text-white truncate">{selectedModel.name}</span>
                  {selectedModel.pricing && (
                    <span className="text-green-400 text-xs ml-2">
                      {formatPrice(selectedModel.pricing.prompt)}/1M
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-slate-400">Select model</span>
              )}
            </div>
            <span className="text-slate-400 ml-2">{isOpen ? '▲' : '▼'}</span>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <div className="absolute left-0 right-0 mt-1 bg-slate-700 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden flex flex-col">
                {/* Search */}
                <div className="p-2 border-b border-slate-600">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search models..."
                    className="w-full px-3 py-1.5 bg-slate-800 text-white text-sm rounded focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="overflow-y-auto">
                  {/* Recommended Section */}
                  {recommendedModels.length > 0 && !searchTerm && (
                    <>
                      <div className="px-3 py-1.5 text-xs text-slate-400 bg-slate-800">
                        ⭐ Recommended
                      </div>
                      {recommendedModels.map((m) => (
                        <ModelOption
                          key={m.id}
                          model={m}
                          selected={model === m.id}
                          onSelect={() => {
                            onModelChange(m.id);
                            setIsOpen(false);
                          }}
                        />
                      ))}
                    </>
                  )}

                  {/* All Models Section */}
                  {filteredOtherModels.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-xs text-slate-400 bg-slate-800">
                        {searchTerm ? `Results (${filteredOtherModels.length})` : 'All Models'}
                      </div>
                      {filteredOtherModels.slice(0, 50).map((m) => (
                        <ModelOption
                          key={m.id}
                          model={m}
                          selected={model === m.id}
                          onSelect={() => {
                            onModelChange(m.id);
                            setIsOpen(false);
                          }}
                        />
                      ))}
                      {filteredOtherModels.length > 50 && (
                        <div className="px-3 py-2 text-xs text-slate-500 text-center">
                          +{filteredOtherModels.length - 50} more (use search)
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Google Info */}
      {provider === 'google' && (
        <div className="text-slate-500 text-xs">
          Using Google Gemini API
        </div>
      )}
    </div>
  );
};

// Extracted model option component
const ModelOption: React.FC<{
  model: AIModel;
  selected: boolean;
  onSelect: () => void;
}> = ({ model, selected, onSelect }) => (
  <div
    onClick={onSelect}
    className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
      selected ? 'bg-purple-600/30' : 'hover:bg-slate-600'
    }`}
  >
    <div className="min-w-0 flex-1">
      <p className="text-white text-sm truncate">{model.name}</p>
      <p className="text-slate-500 text-xs truncate">{model.id}</p>
    </div>
    {model.pricing && (
      <span className="text-green-400 text-xs ml-2 shrink-0">
        {formatPrice(model.pricing.prompt)}/1M
      </span>
    )}
  </div>
);

export default ModelSelector;