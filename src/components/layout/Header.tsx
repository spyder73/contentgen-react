import React, { useState } from 'react';
import { 
  AudioProviderSelector,
  ChatProviderSelector,
  ImageProviderSelector, 
  VideoProviderSelector 
} from '../selectors';
import UserMenu from '../user/UserMenu';
import { Button } from '../ui';
import { PipelineManager } from '../pipeline';
import { 
  ImageProvider, 
  VideoProvider,
  AudioProvider,
  ChatProvider,
} from '../../api/structs/providers';
import { User, Account } from '../../api/structs/user';

interface HeaderProps {
  // Image provider
  imageProvider: ImageProvider;
  imageModel: string;
  onImageProviderChange: (provider: ImageProvider) => void;
  onImageModelChange: (model: string) => void;
  
  // Video provider
  videoProvider: VideoProvider;
  videoModel: string;
  onVideoProviderChange: (provider: VideoProvider) => void;
  onVideoModelChange: (model: string) => void;

  // Audio provider
  audioProvider: AudioProvider;
  audioModel: string;
  onAudioProviderChange: (provider: AudioProvider) => void;
  onAudioModelChange: (model: string) => void;

  // Chat provider (for ideas)
  chatProvider: ChatProvider;
  chatModel: string;
  onChatProviderChange: (provider: ChatProvider) => void;
  onChatModelChange: (model: string) => void;
  
  // User management
  users: User[];
  activeUser: User | null;
  activeAccount: Account | null;
  onAddUser: () => void;
  onSelectUser: (userId: number) => void;
  onRemoveUser: (userId: number) => void;
  onSelectAccount: (accountId: string) => void;
  
  // Modals
  onOpenProxyModal: () => void;
}

const Header: React.FC<HeaderProps> = ({
  imageProvider,
  imageModel,
  onImageProviderChange,
  onImageModelChange,
  videoProvider,
  videoModel,
  onVideoProviderChange,
  onVideoModelChange,
  audioProvider,
  audioModel,
  onAudioProviderChange,
  onAudioModelChange,
  chatProvider,
  chatModel,
  onChatProviderChange,
  onChatModelChange,
  users,
  activeUser,
  activeAccount,
  onAddUser,
  onSelectUser,
  onRemoveUser,
  onSelectAccount,
  onOpenProxyModal,
}) => {
  const [showPipelineManager, setShowPipelineManager] = useState(false);

  return (
    <>
      <header className="page-header flex-shrink-0">
        <div className="page-container py-4">
          {/* Top row - Title & User */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">🎬 ContentGen</h1>
              <Button variant="ghost" size="sm" onClick={onOpenProxyModal}>
                🔌 Proxies
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPipelineManager(true)}
              >
                🔧 Pipelines
              </Button>
            </div>

            <UserMenu
              users={users}
              activeUser={activeUser}
              activeAccount={activeAccount}
              onAddUser={onAddUser}
              onSelectUser={onSelectUser}
              onRemoveUser={onRemoveUser}
              onSelectAccount={onSelectAccount}
            />
          </div>

          {/* Bottom row - All selectors */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">💬 Chat:</span>
              <ChatProviderSelector
                provider={chatProvider}
                model={chatModel}
                onProviderChange={onChatProviderChange}
                onModelChange={onChatModelChange}
              />
            </div>

            <div className="w-px h-6 bg-slate-600" />

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">🖼️ Image:</span>
              <ImageProviderSelector
                provider={imageProvider}
                model={imageModel}
                onProviderChange={onImageProviderChange}
                onModelChange={onImageModelChange}
              />
            </div>

            <div className="w-px h-6 bg-slate-600" />

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">🎬 Video:</span>
              <VideoProviderSelector
                provider={videoProvider}
                model={videoModel}
                onProviderChange={onVideoProviderChange}
                onModelChange={onVideoModelChange}
              />
            </div>

            <div className="w-px h-6 bg-slate-600" />

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">🎵 Audio:</span>
              <AudioProviderSelector
                provider={audioProvider}
                model={audioModel}
                onProviderChange={onAudioProviderChange}
                onModelChange={onAudioModelChange}
              />
            </div>
          </div>
        </div>
      </header>

      <PipelineManager
        isOpen={showPipelineManager}
        onClose={() => setShowPipelineManager(false)}
      />
    </>
  );
};

export default Header;