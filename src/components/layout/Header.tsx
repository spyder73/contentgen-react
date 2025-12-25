import React from 'react';
import { ImageProviderSelector, VideoProviderSelector } from '../selectors';
import UserMenu from '../user/UserMenu';
import { Button } from '../ui';
import { 
  ImageProvider, 
  VideoProvider,
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
  users,
  activeUser,
  activeAccount,
  onAddUser,
  onSelectUser,
  onRemoveUser,
  onSelectAccount,
  onOpenProxyModal,
}) => {
  return (
    <header className="page-header flex-shrink-0">
      <div className="page-container py-4 flex justify-between items-center">
        {/* Left side - Title & Proxy */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">🎬 ContentGen</h1>
          <Button variant="ghost" size="sm" onClick={onOpenProxyModal}>
            🔌 Proxies
          </Button>
        </div>

        {/* Right side - Selectors & User */}
        <div className="flex items-center gap-4">
          <ImageProviderSelector
            provider={imageProvider}
            model={imageModel}
            onProviderChange={onImageProviderChange}
            onModelChange={onImageModelChange}
          />

          <div className="w-px h-6 bg-slate-600" /> {/* Divider */}

          <VideoProviderSelector
            provider={videoProvider}
            model={videoModel}
            onProviderChange={onVideoProviderChange}
            onModelChange={onVideoModelChange}
          />

          <div className="w-px h-6 bg-slate-600" /> {/* Divider */}

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
      </div>
    </header>
  );
};

export default Header;