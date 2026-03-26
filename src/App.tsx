import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ImageProvider,
  VideoProvider,
  AudioProvider,
  DEFAULT_IMAGE_PROVIDER,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_PROVIDER,
  DEFAULT_VIDEO_MODEL,
  DEFAULT_AUDIO_PROVIDER,
  DEFAULT_AUDIO_MODEL,
} from './api/structs/providers';
import { MediaOutputSpec, MediaProfile } from './api/structs/media-spec';
import { settingsToOutputSpec } from './components/selectors/modelSettingsHelpers';
import { Header, Toast } from './components/layout';
import { AddUserModal, ProxyModal } from './components/modals';
import { IdeasList } from './components/ideas';
import { ClipPromptsList } from './components/clips';
import SeriesView from './components/series/SeriesView';
import { useWebSocketEvents } from './hooks';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useUserAccountState } from './hooks/useUserAccountState';
import { ToastProviderWithState } from './hooks/useToast';
import { applyTheme, getDocumentTheme, isThemeMode, THEME_STORAGE_KEY } from './theme';
import { ToastMessage } from './toast';

type AppView = 'studio' | 'series';

function App() {
  const [view, setView] = useState<AppView>('studio');
  const [ideasRefreshTrigger, setIdeasRefreshTrigger] = useState(0);
  const [clipsRefreshTrigger, setClipsRefreshTrigger] = useState(0);
  const [openLibrarySignal, setOpenLibrarySignal] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [storedThemeMode, setStoredThemeMode] = useLocalStorage<string>(THEME_STORAGE_KEY, getDocumentTheme());
  const themeMode = isThemeMode(storedThemeMode) ? storedThemeMode : 'dark';

  // Image provider state
  const [imageProvider] = useLocalStorage<ImageProvider>('imageProvider', DEFAULT_IMAGE_PROVIDER);
  const [imageModel] = useLocalStorage('imageModel', DEFAULT_IMAGE_MODEL);

  // Video provider state
  const [videoProvider] = useLocalStorage<VideoProvider>('videoProvider', DEFAULT_VIDEO_PROVIDER);
  const [videoModel] = useLocalStorage('videoModel', DEFAULT_VIDEO_MODEL);

  // Audio provider state
  const [audioProvider] = useLocalStorage<AudioProvider>('audioProvider', DEFAULT_AUDIO_PROVIDER);
  const [audioModel] = useLocalStorage('audioModel', DEFAULT_AUDIO_MODEL);

  // Per-modality settings (provider-specific extras like width, height, steps, etc.)
  const [imageSettings] = useLocalStorage<Partial<MediaOutputSpec>>('imageSettings', {});
  const [videoSettings] = useLocalStorage<Partial<MediaOutputSpec>>('videoSettings', {});
  const [audioSettings] = useLocalStorage<Partial<MediaOutputSpec>>('audioSettings', {});

  // Modal state
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const pushToast = useCallback((message: ToastMessage) => setToast(message), []);
  const {
    users,
    activeUser,
    activeAccount,
    handleSelectUser,
    handleRemoveUser,
    handleSelectAccount,
    handleAddUser,
  } = useUserAccountState(pushToast);

  const mediaProfile = useMemo<MediaProfile>(() => {
    const profile: MediaProfile = {};

    if (imageProvider && imageModel) {
      profile.image = { provider: imageProvider, model: imageModel, ...settingsToOutputSpec(imageSettings) };
    }
    if (videoProvider && videoModel) {
      profile.video = { provider: videoProvider, model: videoModel, ...settingsToOutputSpec(videoSettings) };
    }
    if (audioProvider && audioModel) {
      profile.audio = { provider: audioProvider, model: audioModel, ...settingsToOutputSpec(audioSettings) };
    }

    return profile;
  }, [imageProvider, imageModel, imageSettings, videoProvider, videoModel, videoSettings, audioProvider, audioModel, audioSettings]);

  // WebSocket for real-time updates
  const refreshIdeas = useCallback(() => setIdeasRefreshTrigger((r) => r + 1), []);
  const refreshClips = useCallback(() => setClipsRefreshTrigger((r) => r + 1), []);
  
  useWebSocketEvents({ 
    onRefreshIdeas: refreshIdeas,
    onRefreshClips: refreshClips,
    onToast: (message) =>
      setToast(typeof message === 'string' ? { text: message, level: 'info' } : message),
  });

  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  return (
    <ToastProviderWithState toast={toast} setToast={setToast}>
    <div className="app-shell h-screen flex flex-col">
      <Toast message={toast} onClose={() => setToast(null)} />

      <Header
        users={users}
        activeUser={activeUser}
        activeAccount={activeAccount}
        onAddUser={() => setShowAddUserModal(true)}
        onSelectUser={handleSelectUser}
        onRemoveUser={handleRemoveUser}
        onSelectAccount={handleSelectAccount}
        themeMode={themeMode}
        onThemeToggle={() => setStoredThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
        onOpenUploadLibrary={() => setOpenLibrarySignal((value) => value + 1)}
        onOpenProxyModal={() => setShowProxyModal(true)}
        activeView={view}
        onSetView={setView}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {view === 'series' ? (
          <div className="page-container h-full py-6 overflow-y-auto">
            <SeriesView />
          </div>
        ) : (
          <div className="page-container h-full py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
              {/* Ideas Panel */}
              <div className="card flex flex-col h-full min-h-0">
                <div className="card-body flex-1 flex flex-col min-h-0">
                  <IdeasList
                    refreshTrigger={ideasRefreshTrigger}
                    openLibrarySignal={openLibrarySignal}
                    onClipsCreated={refreshClips}
                  />
                </div>
              </div>

              {/* Clips Panel */}
              <div className="card flex flex-col h-full min-h-0">
                <div className="card-body flex-1 flex flex-col min-h-0">
                  <ClipPromptsList
                    refreshTrigger={clipsRefreshTrigger}
                    mediaProfile={mediaProfile}
                    activeAccount={activeAccount}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <ProxyModal
        isOpen={showProxyModal}
        onClose={() => setShowProxyModal(false)}
      />
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSubmit={handleAddUser}
      />
    </div>
    </ToastProviderWithState>
  );
}

export default App;
