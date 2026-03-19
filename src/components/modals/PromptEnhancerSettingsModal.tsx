import React from 'react';
import Modal from './Modal';
import ChatProviderSelector from '../selectors/ChatProviderSelector';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ChatProvider, DEFAULT_CHAT_PROVIDER, DEFAULT_CHAT_MODEL } from '../../api/structs/providers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PromptEnhancerSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [provider, setProvider] = useLocalStorage<ChatProvider>('promptEnhancerProvider', DEFAULT_CHAT_PROVIDER);
  const [model, setModel] = useLocalStorage<string>('promptEnhancerModel', DEFAULT_CHAT_MODEL);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="lg" overflow="visible">
      <div className="space-y-6">

        {/* Prompt Enhancer */}
        <div className="space-y-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white">Prompt Enhancer</h3>
            <p className="text-xs text-slate-400 mt-1">
              AI model used to expand and enrich your video idea before generation.
            </p>
          </div>
          <ChatProviderSelector
            provider={provider}
            model={model}
            onProviderChange={setProvider}
            onModelChange={setModel}
          />
        </div>

      </div>
    </Modal>
  );
};

export default PromptEnhancerSettingsModal;
