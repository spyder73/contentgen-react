import React, { useState } from 'react';
import API from '../../api/api';
import { MediaType } from '../../api/structs/media';
import { MediaProfile, MediaOutputSpec } from '../../api/structs/media-spec';
import { Modal } from '../modals';
import { Button, TextArea, Select } from '../ui';

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  clipId: string;
  onSuccess: () => void;
  defaultType: MediaType;
  mediaProfile: MediaProfile;
}

const AddMediaModal: React.FC<AddMediaModalProps> = ({
  isOpen,
  onClose,
  clipId,
  onSuccess,
  defaultType,
  mediaProfile,
}) => {
  const [type, setType] = useState<MediaType>(defaultType);
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getOutputSpec = (): MediaOutputSpec | undefined => {
    switch (type) {
      case 'image': return mediaProfile.image;
      case 'ai_video': return mediaProfile.video;
      case 'audio': return mediaProfile.audio;
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setIsSubmitting(true);
    try {
      const outputSpec = getOutputSpec();

      switch (type) {
        case 'image':
          await API.createImage(clipId, prompt, undefined, outputSpec);
          break;
        case 'ai_video':
          await API.createAIVideo(clipId, prompt, undefined, outputSpec);
          break;
        case 'audio':
          await API.createAudio(clipId, prompt, undefined, outputSpec);
          break;
      }

      setPrompt('');
      onClose();
      onSuccess();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const outputSpec = getOutputSpec();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add ${type}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Type
          </label>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as MediaType)}
            options={[
              { value: 'image', label: '🖼️ Image' },
              { value: 'ai_video', label: '🎬 AI Video' },
              { value: 'audio', label: '🎵 Audio' },
            ]}
            selectSize="sm"
          />
        </div>

        <TextArea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what to generate..."
          rows={4}
        />

        {outputSpec && (
          <div className="text-xs text-slate-500 bg-slate-800/50 rounded p-2">
            <span className="font-medium">Output:</span>{' '}
            {outputSpec.provider}/{outputSpec.model}
            {outputSpec.width && outputSpec.height
              ? ` · ${outputSpec.width}×${outputSpec.height}`
              : ''}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !prompt.trim()}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddMediaModal;
