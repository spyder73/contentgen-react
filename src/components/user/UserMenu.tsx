import React, { useState } from 'react';
import { User, Account } from '../../api/structs/user';

interface UserMenuProps {
  users: User[];
  activeUser: User | null;
  activeAccount: Account | null;
  onAddUser: () => void;
  onSelectUser: (user: number) => void;
  onRemoveUser: (userID: number) => void;
  onSelectAccount: (accountID: string) => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ 
  users, 
  activeUser, 
  activeAccount,
  onAddUser, 
  onSelectUser,
  onRemoveUser,
  onSelectAccount
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'tiktok': return '🎵';
      case 'instagram': return '📸';
      case 'youtube': return '▶️';
      default: return '🔗';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm"
      >
        <span>👤</span>
        <div className="flex flex-col items-start">
          <span>{activeUser ? `@${activeUser.username}` : 'No User'}</span>
          {activeAccount && (
            <span className="text-xs text-slate-400">
              {activeAccount.is_ai && '🤖 '}{activeAccount.username}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400">▼</span>
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-lg shadow-lg z-50 py-2">
            {/* Users */}
            {users.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="border-b border-slate-700 last:border-b-0">
                    {/* User Header */}
                    <div
                      className={`px-4 py-2 hover:bg-slate-700 cursor-pointer flex items-center justify-between ${
                        activeUser?.id === user.id ? 'bg-slate-700' : ''
                      }`}
                      onClick={() => {
                        onSelectUser(user.id);
                      }}
                    >
                      <div>
                        <p className="text-white text-sm font-medium">
                          @{user.username}
                          {activeUser?.id === user.id && (
                            <span className="text-green-400 ml-2">✓</span>
                          )}
                        </p>
                        <p className="text-slate-500 text-xs">ID: {user.id}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveUser(user.id);
                        }}
                        className="text-red-400 hover:text-red-300 text-sm p-1"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Accounts (only show for active user) */}
                    {activeUser?.id === user.id && user.accounts && user.accounts.length > 0 && (
                      <div className="bg-slate-750 px-2 py-2">
                        <p className="text-slate-400 text-xs px-2 mb-1">Social Accounts:</p>
                        {user.accounts.map((account) => (
                          <div
                            key={account._id}
                            className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${
                              activeAccount?._id === account._id 
                                ? 'bg-blue-600/30 border border-blue-500/50' 
                                : 'hover:bg-slate-600'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAccount(account._id);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {account.is_ai && <span>🤖</span>}
                              <span className="text-white text-sm">{account.username}</span>
                              <span className="text-slate-400 text-xs">
                                {account.platforms.map(p => getPlatformIcon(p)).join(' ')}
                              </span>
                            </div>
                            {activeAccount?._id === account._id && (
                              <span className="text-green-400 text-xs">Active</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {users.length > 0 && <div className="border-t border-slate-700 my-1" />}

            <button
              onClick={() => {
                onAddUser();
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2 text-blue-400 hover:bg-slate-700 text-sm"
            >
              ➕ Add User
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;