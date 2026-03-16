import React, { useState } from 'react';
import UserMenu from '../user/UserMenu';
import { Button } from '../ui';
import { PipelineManager } from '../pipeline';
import { User, Account } from '../../api/structs/user';
import { ThemeMode } from '../../theme';

interface HeaderProps {
  // User management
  users: User[];
  activeUser: User | null;
  activeAccount: Account | null;
  onAddUser: () => void;
  onSelectUser: (id: number) => void;
  onRemoveUser: (id: number) => void;
  onSelectAccount: (id: string) => void;
  themeMode: ThemeMode;
  onThemeToggle: () => void;
  onOpenUploadLibrary: () => void;
  
  // Modals
  onOpenProxyModal: () => void;
}

const Header: React.FC<HeaderProps> = ({
  users,
  activeUser,
  activeAccount,
  onAddUser,
  onSelectUser,
  onRemoveUser,
  onSelectAccount,
  themeMode,
  onThemeToggle,
  onOpenUploadLibrary,
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
              <h1 className="text-xl font-semibold uppercase tracking-[0.25em] text-white">ContentGen</h1>
              <Button variant="ghost" size="sm" onClick={onOpenProxyModal}>
                Proxies
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPipelineManager(true)}
              >
                Pipelines
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenUploadLibrary}
                className="border border-dashed border-white/40 bg-black/20 text-white"
              >
                Upload Media
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                role="switch"
                aria-checked={themeMode === 'dark'}
                aria-label="Toggle dark and light mode"
                className="theme-switch"
                onClick={onThemeToggle}
              >
                <span className="theme-switch-track">
                  <span
                    className={`theme-switch-thumb ${themeMode === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </span>
                <span className="theme-switch-label">{themeMode === 'dark' ? 'Dark' : 'Light'}</span>
              </button>

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
