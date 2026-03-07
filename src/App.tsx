import React, { useState, useEffect, useCallback, useMemo } from 'react';
import API from './api/api';
import { 
  ImageProvider, 
  VideoProvider,
  AudioProvider,
  ChatProvider,
  DEFAULT_IMAGE_PROVIDER,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_PROVIDER,
  DEFAULT_VIDEO_MODEL,
  DEFAULT_AUDIO_PROVIDER,
  DEFAULT_AUDIO_MODEL,
  DEFAULT_CHAT_PROVIDER,
  DEFAULT_CHAT_MODEL,
} from './api/structs/providers';
import { MediaOutputSpec, MediaProfile } from './api/structs/media-spec';
import { settingsToOutputSpec } from './components/selectors/modelSettingsHelpers';
import { User, Account } from './api/structs/user';
import { Header, Toast } from './components/layout';
import { AddUserModal, ProxyModal } from './components/modals';
import { IdeasList } from './components/ideas';
import { ClipPromptsList } from './components/clips';
import { useWebSocketEvents } from './hooks';
import { useLocalStorage } from './hooks/useLocalStorage';
import { applyTheme, getDocumentTheme, isThemeMode, THEME_STORAGE_KEY } from './theme';
import { ToastMessage } from './toast';

function App() {
  const [ideasRefreshTrigger, setIdeasRefreshTrigger] = useState(0);
  const [clipsRefreshTrigger, setClipsRefreshTrigger] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [storedThemeMode, setStoredThemeMode] = useLocalStorage<string>(THEME_STORAGE_KEY, getDocumentTheme());
  const themeMode = isThemeMode(storedThemeMode) ? storedThemeMode : 'dark';

  // Image provider state
  const [imageProvider, setImageProvider] = useLocalStorage<ImageProvider>('imageProvider', DEFAULT_IMAGE_PROVIDER);
  const [imageModel, setImageModel] = useLocalStorage('imageModel', DEFAULT_IMAGE_MODEL);

  // Video provider state
  const [videoProvider, setVideoProvider] = useLocalStorage<VideoProvider>('videoProvider', DEFAULT_VIDEO_PROVIDER);
  const [videoModel, setVideoModel] = useLocalStorage('videoModel', DEFAULT_VIDEO_MODEL);

  // Audio provider state
  const [audioProvider, setAudioProvider] = useLocalStorage<AudioProvider>('audioProvider', DEFAULT_AUDIO_PROVIDER);
  const [audioModel, setAudioModel] = useLocalStorage('audioModel', DEFAULT_AUDIO_MODEL);

  // Chat provider state (for ideas generation)
  const [chatProvider, setChatProvider] = useLocalStorage<ChatProvider>('chatProvider', DEFAULT_CHAT_PROVIDER);
  const [chatModel, setChatModel] = useLocalStorage('chatModel', DEFAULT_CHAT_MODEL);

  // Per-modality settings (provider-specific extras like width, height, steps, etc.)
  const [imageSettings, setImageSettings] = useLocalStorage<Partial<MediaOutputSpec>>('imageSettings', {});
  const [videoSettings, setVideoSettings] = useLocalStorage<Partial<MediaOutputSpec>>('videoSettings', {});
  const [audioSettings, setAudioSettings] = useLocalStorage<Partial<MediaOutputSpec>>('audioSettings', {});

  // User state
  const [users, setUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);

  // Modal state
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

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

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await API.getUsers();
        setUsers(response.users || []);
        setActiveUser(response.active_user);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Fetch active account when active user changes
  useEffect(() => {
    const fetchActiveAccount = async () => {
      if (!activeUser) {
        setActiveAccount(null);
        return;
      }
      try {
        const account = await API.getActiveAccount();
        setActiveAccount(account);
      } catch (error) {
        console.error('Failed to fetch active account:', error);
      }
    };
    fetchActiveAccount();
  }, [activeUser]);

  const handleSelectUser = async (userId: number) => {
    try {
      await API.setActiveUser(userId);
      const user = users.find((u) => u.id === userId);
      setActiveUser(user || null);
      setToast({ text: `Switched to ${user?.username}`, level: 'success' });
    } catch (error) {
      console.error('Failed to select user:', error);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    try {
      await API.removeUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
      if (activeUser?.id === userId) {
        setActiveUser(null);
      }
      setToast({ text: 'User removed', level: 'warning' });
    } catch (error) {
      console.error('Failed to remove user:', error);
    }
  };

  const handleSelectAccount = async (accountId: string) => {
    try {
      const account = await API.setActiveAccount(accountId);
      setActiveAccount(account);
      setToast({ text: `Switched to @${account.username}`, level: 'success' });
    } catch (error) {
      console.error('Failed to select account:', error);
    }
  };

  const handleAddUser = async (username: string, userId: number) => {
    try {
      const user = await API.addUser(username, userId);
      setUsers([...users, user]);
      setShowAddUserModal(false);
      setToast({ text: `Added ${username}`, level: 'success' });
    } catch (error) {
      console.error('Failed to add user:', error);
    }
  };

  return (
    <div className="app-shell h-screen flex flex-col">
      <Toast message={toast} onClose={() => setToast(null)} />

      <Header
        imageProvider={imageProvider}
        imageModel={imageModel}
        onImageProviderChange={setImageProvider}
        onImageModelChange={setImageModel}
        imageSettings={imageSettings}
        onImageSettingsChange={setImageSettings}
        videoProvider={videoProvider}
        videoModel={videoModel}
        onVideoProviderChange={setVideoProvider}
        onVideoModelChange={setVideoModel}
        videoSettings={videoSettings}
        onVideoSettingsChange={setVideoSettings}
        audioProvider={audioProvider}
        audioModel={audioModel}
        onAudioProviderChange={setAudioProvider}
        onAudioModelChange={setAudioModel}
        audioSettings={audioSettings}
        onAudioSettingsChange={setAudioSettings}
        chatProvider={chatProvider}
        chatModel={chatModel}
        onChatProviderChange={setChatProvider}
        onChatModelChange={setChatModel}
        users={users}
        activeUser={activeUser}
        activeAccount={activeAccount}
        onAddUser={() => setShowAddUserModal(true)}
        onSelectUser={handleSelectUser}
        onRemoveUser={handleRemoveUser}
        onSelectAccount={handleSelectAccount}
        themeMode={themeMode}
        onThemeToggle={() => setStoredThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
        onOpenProxyModal={() => setShowProxyModal(true)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="page-container h-full py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
            {/* Ideas Panel */}
            <div className="card flex flex-col h-full min-h-0">
              <div className="card-body flex-1 flex flex-col min-h-0">
                <IdeasList
                  refreshTrigger={ideasRefreshTrigger}
                  chatProvider={chatProvider}
                  chatModel={chatModel}
                  mediaProfile={mediaProfile}
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
  );
}

export default App;
