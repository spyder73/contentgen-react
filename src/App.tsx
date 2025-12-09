import React, { useState, useEffect, useCallback } from 'react';
import API, { User, Account, ImageGenerator } from './api/api';
import IdeasList from './components/IdeasList';
import VideoPromptsList from './components/VideoPromptsList';
import { useWebSocket } from './hooks/useWebSocket';
import UserMenu from './components/UserMenu';
import { ProxyModal, AddUserModal } from './components/modals';
import ImageModelSelector from './components/ImageModelSelector';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);

  // Image generator state
  const [imageGenerator, setImageGenerator] = useState<ImageGenerator>('openrouter');
  const [imageModel, setImageModel] = useState('google/gemini-2.0-flash-exp:free');

  const handleScheduleUpdate = useCallback((data: any) => {
    const msg = data.success 
      ? `✅ ${data.message}` 
      : `❌ ${data.message}`;
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  }, []);

  useWebSocket(
    'ws://localhost:81/webhook',
    () => setRefreshTrigger(prev => prev + 1),
    handleScheduleUpdate
  );

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await API.getUsers();
        setUsers(response.users || []);
        setActiveUser(response.active_user);

        if (response.users && response.users.length > 0) {
          const refreshed = await API.refreshAccounts();
          setUsers(refreshed.users || []);
          setActiveUser(refreshed.active_user);
        }

        const account = await API.getActiveAccount();
        setActiveAccount(account);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleAddUser = async (username: string, userID: number) => {
    try {
      await API.addUser(username, userID);
      const response = await API.getUsers();
      setUsers(response.users || []);
      setActiveUser(response.active_user);
      const account = await API.getActiveAccount();
      setActiveAccount(account);
    } catch (error: any) {
      alert(`Failed to add user: ${error.message}`);
    }
  };

  const handleSelectUser = async (userID: number) => {
    try {
      const user = await API.setActiveUser(userID);
      setActiveUser(user);
      const account = await API.getActiveAccount();
      setActiveAccount(account);
    } catch (error: any) {
      alert(`Failed to select user: ${error.message}`);
    }
  };

  const handleRemoveUser = async (userID: number) => {
    try {
      await API.removeUser(userID);
      const response = await API.getUsers();
      setUsers(response.users || []);
      setActiveUser(response.active_user);
      const account = await API.getActiveAccount();
      setActiveAccount(account);
    } catch (error: any) {
      alert(`Failed to remove user: ${error.message}`);
    }
  };

  const handleSelectAccount = async (accountID: string) => {
    try {
      const account = await API.setActiveAccount(accountID);
      setActiveAccount(account);
    } catch (error: any) {
      alert(`Failed to select account: ${error.message}`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg shadow-lg text-white">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-lg flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">🎬 Content Generator</h1>
          
          <div className="flex items-center gap-3">
            {/* Image Generator Selector */}
            <ImageModelSelector
              provider={imageGenerator}
              model={imageModel}
              onProviderChange={setImageGenerator}
              onModelChange={setImageModel}
            />

            <button
              onClick={() => setShowProxyModal(true)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
            >
              🌐 Proxies
            </button>

            <UserMenu
              users={users}
              activeUser={activeUser}
              activeAccount={activeAccount}
              onAddUser={() => setShowAddUserModal(true)}
              onSelectUser={handleSelectUser}
              onRemoveUser={handleRemoveUser}
              onSelectAccount={handleSelectAccount}
            />
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable columns */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 py-6">
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Video Prompts */}
            <div className="h-full overflow-y-auto pr-2">
              <VideoPromptsList 
                onRefresh={refreshTrigger} 
                activeAccount={activeAccount}
                imageGenerator={imageGenerator}
                imageModel={imageModel}
              />
            </div>
            
            {/* Right Column - Ideas */}
            <div className="h-full overflow-y-auto pr-2">
              <IdeasList 
                onRefresh={refreshTrigger}
                imageGenerator={imageGenerator}
                imageModel={imageModel}
              />
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
