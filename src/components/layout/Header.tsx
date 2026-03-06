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
import { User, Account } from '../../api/structs/user';
import { MediaOutputSpec } from '../../api/structs/media-spec';
import { ImageProvider, VideoProvider, AudioProvider, ChatProvider } from '../../api/structs/providers';

interface HeaderProps {
  // Image provider
  imageProvider: ImageProvider;
  imageModel: string;
  onImageProviderChange: (p: ImageProvider) => void;
  onImageModelChange: (m: string) => void;
  imageSettings: Partial<MediaOutputSpec>;
  onImageSettingsChange: (s: Partial<MediaOutputSpec>) => void;
  
  // Video provider
  videoProvider: VideoProvider;
  videoModel: string;
  onVideoProviderChange: (p: VideoProvider) => void;
  onVideoModelChange: (m: string) => void;
  videoSettings: Partial<MediaOutputSpec>;
  onVideoSettingsChange: (s: Partial<MediaOutputSpec>) => void;

  // Audio provider
  audioProvider: AudioProvider;
  audioModel: string;
  onAudioProviderChange: (p: AudioProvider) => void;
  onAudioModelChange: (m: string) => void;
  audioSettings: Partial<MediaOutputSpec>;
  onAudioSettingsChange: (s: Partial<MediaOutputSpec>) => void;

  // Chat provider (for ideas)
  chatProvider: ChatProvider;
  chatModel: string;
  onChatProviderChange: (p: ChatProvider) => void;
  onChatModelChange: (m: string) => void;
  
  // User management
  users: User[];
  activeUser: User | null;
  activeAccount: Account | null;
  onAddUser: () => void;
  onSelectUser: (id: number) => void;
  onRemoveUser: (id: number) => void;
  onSelectAccount: (id: string) => void;
  
  // Modals
  onOpenProxyModal: () => void;
}

const Header: React.FC<HeaderProps> = ({
  imageProvider,
  imageModel,
  onImageProviderChange,
  onImageModelChange,
  imageSettings,
  onImageSettingsChange,
  videoProvider,
  videoModel,
  onVideoProviderChange,
  onVideoModelChange,
  videoSettings,
  onVideoSettingsChange,
  audioProvider,
  audioModel,
  onAudioProviderChange,
  onAudioModelChange,
  audioSettings,
  onAudioSettingsChange,
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

          {/* Bottom row - All selectors (each renders its own settings modal) */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">💬</span>
              <ChatProviderSelector
                provider={chatProvider}
                model={chatModel}
                onProviderChange={onChatProviderChange}
                onModelChange={onChatModelChange}
              />
            </div>

            <div className="w-px h-6 bg-slate-600" />

            <div className="flex items-center gap-2">
              <ImageProviderSelector
                provider={imageProvider}
                model={imageModel}
                onProviderChange={onImageProviderChange}
                onModelChange={onImageModelChange}
                settings={imageSettings}
                onSettingsChange={onImageSettingsChange}
              />
            </div>

            <div className="w-px h-6 bg-slate-600" />

            <div className="flex items-center gap-2">
              <VideoProviderSelector
                provider={videoProvider}
                model={videoModel}
                onProviderChange={onVideoProviderChange}
                onModelChange={onVideoModelChange}
                settings={videoSettings}
                onSettingsChange={onVideoSettingsChange}
              />
            </div>

            <div className="w-px h-6 bg-slate-600" />

            <div className="flex items-center gap-2">
              <AudioProviderSelector
                provider={audioProvider}
                model={audioModel}
                onProviderChange={onAudioProviderChange}
                onModelChange={onAudioModelChange}
                settings={audioSettings}
                onSettingsChange={onAudioSettingsChange}
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
