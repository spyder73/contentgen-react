import React, { useState } from 'react';
import API from '../../api/api';
import { MediaType } from '../../api/structs/media';
import { Generator } from '../../api/structs/providers';
import { Button, TextArea } from '../ui';
import Modal from './Modal';

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  clipId: string;
  onSuccess: () => void;
  // Default type, can be overridden
  defaultType?: MediaType;
  // Generators for each type
  imageGenerator: Generator;
  imageModel: string;
  videoGenerator: Generator;
  videoModel: string;
  audioGenerator?: Generator;
  audioModel?: string;
}

const AddMediaModal: React.FC<AddMediaModalProps> = ({
  isOpen,
  onClose,
  clipId,
  onSuccess,
  defaultType = 'image',
  imageGenerator,
  imageModel,
  videoGenerator,
  videoModel,
  audioGenerator = 'suno',
  audioModel = '',
}) => {
  const [mediaType, setMediaType] = useState<MediaType>(defaultType);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getGeneratorForType = (type: MediaType): { generator: Generator; model: string } => {
    switch (type) {
      case 'image':
        return { generator: imageGenerator, model: imageModel };
      case 'ai_video':
        return { generator: videoGenerator, model: videoModel };
      case 'audio':
        return { generator: audioGenerator, model: audioModel };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const { generator, model } = getGeneratorForType(mediaType);
      
      await API.createMediaItem({
        clip_id: clipId,
        type: mediaType,
        prompt,
        generator,
        model,
      });
      
      setPrompt('');
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const { generator, model } = getGeneratorForType(mediaType);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Media">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Media Type Selector */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Media Type</label>
          <div className="flex gap-2">
            {(['image', 'ai_video', 'audio'] as MediaType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMediaType(type)}
                className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                  mediaType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {type === 'image' && '🖼️ Image'}
                {type === 'ai_video' && '🎬 Video'}
                {type === 'audio' && '🎵 Audio'}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Prompt</label>
          <TextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Describe the ${mediaType.replace('_', ' ')} you want to generate...`}
            rows={4}
          />
        </div>

        {/* Generator Info */}
        <div className="text-xs text-slate-500">
          Using: {generator} • {model || 'default'}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={isLoading}
            disabled={!prompt.trim()}
          >
            Generate
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMediaModal;