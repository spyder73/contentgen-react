import React, { useState } from 'react';
import UserMenu from '../user/UserMenu';
import { Button } from '../ui';
import { PipelineManager } from '../pipeline';
import { PromptEnhancerSettingsModal } from '../modals';
import { User, Account } from '../../api/structs/user';
import { ThemeMode } from '../../theme';

type AppView = 'studio' | 'series' | 'docs';

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

  // View navigation
  activeView: AppView;
  onSetView: (view: AppView) => void;
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
  activeView,
  onSetView,
}) => {
  const [showPipelineManager, setShowPipelineManager] = useState(false);
  const [showEnhancerSettings, setShowEnhancerSettings] = useState(false);

  return (
    <>
      <header className="page-header flex-shrink-0">
        <div className="page-container py-4">
          {/* Top row - Title & User */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold uppercase tracking-[0.25em] text-white">SpyderGen</h1>

              {/* View switcher */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSetView('studio')}
                  className={activeView === 'studio' ? 'text-white bg-white/10' : ''}
                >
                  Studio
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSetView('series')}
                  className={activeView === 'series' ? 'text-white bg-white/10' : ''}
                >
                  Series
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSetView('docs')}
                  className={activeView === 'docs' ? 'text-white bg-white/10' : ''}
                >
                  Docs
                </Button>
              </div>

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

              <div className="flex items-center gap-1">
                <UserMenu
                  users={users}
                  activeUser={activeUser}
                  activeAccount={activeAccount}
                  onAddUser={onAddUser}
                  onSelectUser={onSelectUser}
                  onRemoveUser={onRemoveUser}
                  onSelectAccount={onSelectAccount}
                />

                <button
                  type="button"
                  onClick={() => setShowEnhancerSettings(true)}
                  title="Settings"
                  className="flex items-center justify-center w-8 h-8 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

        </div>
      </header>

      <PipelineManager
        isOpen={showPipelineManager}
        onClose={() => setShowPipelineManager(false)}
      />

      <PromptEnhancerSettingsModal
        isOpen={showEnhancerSettings}
        onClose={() => setShowEnhancerSettings(false)}
      />
    </>
  );
};

export default Header;
