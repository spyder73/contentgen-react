import React, { useState, useEffect, useCallback } from 'react';
import API from './api/api';
import { 
  ImageProvider, 
  VideoProvider,
  DEFAULT_IMAGE_PROVIDER,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_PROVIDER,
  DEFAULT_VIDEO_MODEL,
} from './api/structs/providers';
import { User, Account } from './api/structs/user';
import { Header, Toast } from './components/layout';
import { AddUserModal, ProxyModal } from './components/modals';
import { IdeasList } from './components/ideas';
import { ClipPromptsList } from './components/clips';
import { useWebSocketEvents } from './hooks';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  // Image provider state
  const [imageProvider, setImageProvider] = useState<ImageProvider>(DEFAULT_IMAGE_PROVIDER);
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL);

  // Video provider state
  const [videoProvider, setVideoProvider] = useState<VideoProvider>(DEFAULT_VIDEO_PROVIDER);
  const [videoModel, setVideoModel] = useState(DEFAULT_VIDEO_MODEL);

  // User state
  const [users, setUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);

  // Modal state
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // WebSocket for real-time updates
  const triggerRefresh = useCallback(() => setRefreshTrigger((r) => r + 1), []);
  useWebSocketEvents({ 
    onRefresh: triggerRefresh, 
    onToast: setToast 
  });

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
      setToast(`Switched to ${user?.username}`);
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
      setToast('User removed');
    } catch (error) {
      console.error('Failed to remove user:', error);
    }
  };

  const handleSelectAccount = async (accountId: string) => {
    try {
      const account = await API.setActiveAccount(accountId);
      setActiveAccount(account);
      setToast(`Switched to @${account.username}`);
    } catch (error) {
      console.error('Failed to select account:', error);
    }
  };

  const handleAddUser = async (username: string, userId: number) => {
    try {
      const user = await API.addUser(username, userId);
      setUsers([...users, user]);
      setShowAddUserModal(false);
      setToast(`Added ${username}`);
    } catch (error) {
      console.error('Failed to add user:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <Toast message={toast} onClose={() => setToast(null)} />

      <Header
        imageProvider={imageProvider}
        imageModel={imageModel}
        onImageProviderChange={setImageProvider}
        onImageModelChange={setImageModel}
        videoProvider={videoProvider}
        videoModel={videoModel}
        onVideoProviderChange={setVideoProvider}
        onVideoModelChange={setVideoModel}
        users={users}
        activeUser={activeUser}
        activeAccount={activeAccount}
        onAddUser={() => setShowAddUserModal(true)}
        onSelectUser={handleSelectUser}
        onRemoveUser={handleRemoveUser}
        onSelectAccount={handleSelectAccount}
        onOpenProxyModal={() => setShowProxyModal(true)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="page-container h-full py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Ideas Panel */}
            <div className="card flex flex-col overflow-hidden">
              <div className="card-body flex-1 overflow-hidden">
                <IdeasList
                  onRefresh={refreshTrigger}
                  imageProvider={imageProvider}
                  videoProvider={videoProvider}
                  imageModel={imageModel}
                  videoModel={videoModel}
                />
              </div>
            </div>

            {/* Clips Panel */}
            <div className="card flex flex-col overflow-hidden">
              <div className="card-body flex-1 overflow-hidden">
                <ClipPromptsList
                  onRefresh={refreshTrigger}
                  onTriggerRefresh={triggerRefresh}
                  imageProvider={imageProvider}
                  imageModel={imageModel}
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
