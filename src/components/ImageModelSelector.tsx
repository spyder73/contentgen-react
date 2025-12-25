import React, { useEffect, useState } from 'react';
import API, { AIModel, supportsImageOutput } from '../api/api';

export type ImageProvider = 'pollinations' | 'openrouter' | 'runware';

interface ImageModelSelectorProps {
  provider: ImageProvider;
  model: string;
  onProviderChange: (provider: ImageProvider) => void;
  onModelChange: (model: string) => void;
}

const RECOMMENDED_IMAGE_MODELS = [
  'openai/gpt-5-image-mini'
];

const formatPrice = (model: AIModel): string => {
  if (!model.pricing) return 'Free';
  const price = parseFloat(model.pricing.image || model.pricing.prompt || '0');
  if (price === 0) return 'Free';
  const perImage = price * 200;
  if (perImage < 0.0001) return '<$0.0001';
  if (perImage < 0.01) return `$${perImage.toFixed(4)}`;
  return `$${perImage.toFixed(3)}`;
};

const ImageModelSelector: React.FC<ImageModelSelectorProps> = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
}) => {
  const [allModels, setAllModels] = useState<AIModel[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const response = await API.getModels();
        const allModels = [...(response.all|| []), ...(response.recommended || [])];
        // Remove duplicates by ID
        const uniqueModels = Array.from(
          new Map(allModels.map(m => [m.id, m])).values()
        );
        const imageModels = uniqueModels.filter(supportsImageOutput);
        setAllModels(imageModels);

        // Set default model if none is selected
        if (!model && imageModels.length > 0) {
          // Prefer the first recommended model with image output
          const recommendedImageModels = (response.recommended || []).filter(supportsImageOutput);
          const defaultModel = recommendedImageModels[0] || imageModels[0];
          onModelChange(defaultModel.id);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  const selectedModel = allModels.find(m => m.id === model);

  const recommendedSet = new Set(RECOMMENDED_IMAGE_MODELS);
  const recommendedModels = allModels.filter(m => recommendedSet.has(m.id));
  const otherModels = allModels.filter(m => !recommendedSet.has(m.id));

  const filterBySearch = (models: AIModel[]) => {
    if (!searchTerm) return models;
    const term = searchTerm.toLowerCase();
    return models.filter(m =>
      m.name.toLowerCase().includes(term) ||
      m.id.toLowerCase().includes(term)
    );
  };

  const filteredRecommended = filterBySearch(recommendedModels);
  const filteredOther = filterBySearch(otherModels);

  return (
    <div className="flex gap-2 items-center">
      <span className="text-slate-400 text-sm">🖼️</span>

      <select
        value={provider}
        onChange={(e) => onProviderChange(e.target.value as ImageProvider)}
        className="px-3 py-1.5 bg-slate-700 text-white rounded text-sm"
      >
        <option value="pollinations">Pollinations</option>
        <option value="openrouter">OpenRouter</option>
        <option value="runware">Runware</option>
      </select>

      {provider === 'openrouter' && (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-1.5 bg-slate-700 text-white rounded text-sm flex items-center gap-2 hover:bg-slate-600 transition-colors min-w-[200px] justify-between"
          >
            {loading ? (
              <span className="text-slate-400">Loading...</span>
            ) : selectedModel ? (
              <div className="flex items-center justify-between flex-1">
                <span className="truncate">{selectedModel.name}</span>
                <span className="text-green-400 text-xs ml-2">{formatPrice(selectedModel)}</span>
              </div>
            ) : (
              <span className="text-slate-400">Select model</span>
            )}
            <span className="text-slate-400">{isOpen ? '▲' : '▼'}</span>
          </button>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <div className="absolute right-0 mt-1 bg-slate-700 rounded-lg shadow-xl z-50 max-h-96 w-80 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-slate-600">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search image models..."
                    className="w-full px-3 py-1.5 bg-slate-800 text-white text-sm rounded focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="overflow-y-auto">
                  {filteredRecommended.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-xs text-slate-400 bg-slate-800 sticky top-0">
                        ⭐ Recommended
                      </div>
                      {filteredRecommended.map((m) => (
                        <ModelOption
                          key={m.id}
                          model={m}
                          selected={model === m.id}
                          onSelect={() => {
                            onModelChange(m.id);
                            setIsOpen(false);
                            setSearchTerm('');
                          }}
                        />
                      ))}
                    </>
                  )}

                  {filteredOther.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-xs text-slate-400 bg-slate-800 sticky top-0">
                        All Image Models
                      </div>
                      {filteredOther.slice(0, 50).map((m) => (
                        <ModelOption
                          key={m.id}
                          model={m}
                          selected={model === m.id}
                          onSelect={() => {
                            onModelChange(m.id);
                            setIsOpen(false);
                            setSearchTerm('');
                          }}
                        />
                      ))}
                      {filteredOther.length > 50 && (
                        <div className="px-3 py-2 text-xs text-slate-500 text-center">
                          +{filteredOther.length - 50} more (use search)
                        </div>
                      )}
                    </>
                  )}

                  {filteredRecommended.length === 0 && filteredOther.length === 0 && (
                    <div className="px-3 py-4 text-slate-500 text-center text-sm">
                      No image models found
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

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
    <span className="text-green-400 text-xs ml-2 shrink-0">{formatPrice(model)}</span>
  </div>
);

export default ImageModelSelector;