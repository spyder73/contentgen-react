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

  return (
    <div className="relative z-[150]">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 border border-white/20 bg-black/70 hover:bg-white/10 text-white text-xs uppercase tracking-wide"
      >
        <div className="flex flex-col items-start">
          <span>{activeUser ? `@${activeUser.username}` : 'No User'}</span>
          {activeAccount && (
            <span className="text-xs text-slate-400">
              {activeAccount.is_ai && 'AI '}{activeAccount.username}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400">{showDropdown ? 'Close' : 'Open'}</span>
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-[140]" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-black border border-white/20 shadow-2xl z-[150] py-2">
            {/* Users */}
            {users.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="border-b border-white/10 last:border-b-0">
                    {/* User Header */}
                    <div
                      className={`px-4 py-2 hover:bg-white/10 cursor-pointer flex items-center justify-between ${
                        activeUser?.id === user.id ? 'bg-white/10' : ''
                      }`}
                      onClick={() => {
                        onSelectUser(user.id);
                      }}
                    >
                      <div>
                        <p className="text-white text-sm font-medium">
                          @{user.username}
                          {activeUser?.id === user.id && (
                            <span className="text-zinc-300 ml-2">Active</span>
                          )}
                        </p>
                        <p className="text-slate-500 text-xs">ID: {user.id}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveUser(user.id);
                        }}
                        className="text-zinc-300 hover:text-white text-xs p-1 border border-white/20"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Accounts (only show for active user) */}
                    {activeUser?.id === user.id && user.accounts && user.accounts.length > 0 && (
                      <div className="bg-black/50 px-2 py-2">
                        <p className="text-slate-400 text-xs px-2 mb-1">Social Accounts:</p>
                        {user.accounts.map((account) => (
                          <div
                            key={account._id}
                            className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${
                              activeAccount?._id === account._id 
                                ? 'bg-white/10 border border-white/30'
                                : 'hover:bg-white/10'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAccount(account._id);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {account.is_ai && <span className="text-[10px] text-zinc-400">AI</span>}
                              <span className="text-white text-sm">{account.username}</span>
                              <span className="text-slate-400 text-[10px] uppercase">
                                {account.platforms.join(', ')}
                              </span>
                            </div>
                            {activeAccount?._id === account._id && (
                              <span className="text-zinc-300 text-xs">Active</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {users.length > 0 && <div className="border-t border-white/10 my-1" />}

            <button
              onClick={() => {
                onAddUser();
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2 text-zinc-200 hover:bg-white/10 text-sm uppercase tracking-wide"
            >
              Add User
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
