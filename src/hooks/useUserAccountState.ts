import { useCallback, useEffect, useState } from 'react';
import API from '../api/api';
import { Account, User } from '../api/structs/user';
import { ToastMessage } from '../toast';

type PushToast = (toast: ToastMessage) => void;

const toErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
};

const mergeUser = (users: User[], nextUser: User): User[] => {
  const index = users.findIndex((user) => user.id === nextUser.id);
  if (index === -1) return [...users, nextUser];
  const updated = [...users];
  updated[index] = nextUser;
  return updated;
};

interface UseUserAccountStateResult {
  users: User[];
  activeUser: User | null;
  activeAccount: Account | null;
  handleSelectUser: (userId: number) => Promise<void>;
  handleRemoveUser: (userId: number) => Promise<void>;
  handleSelectAccount: (accountId: string) => Promise<void>;
  handleAddUser: (username: string, userId: number) => Promise<void>;
}

export function useUserAccountState(pushToast: PushToast): UseUserAccountStateResult {
  const [users, setUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);

  const fetchUsers = useCallback(async () => {
    const response = await API.getUsers();
    setUsers(response.users || []);
    setActiveUser(response.active_user || null);
  }, []);

  useEffect(() => {
    fetchUsers().catch((error) => {
      pushToast({ text: toErrorMessage(error, 'Failed to fetch users'), level: 'error' });
      console.error('Failed to fetch users:', error);
    });
  }, [fetchUsers, pushToast]);

  useEffect(() => {
    const fetchActiveAccount = async () => {
      if (!activeUser) {
        setActiveAccount(null);
        return;
      }
      try {
        const account = await API.getActiveAccount();
        setActiveAccount(account || null);
      } catch (error) {
        setActiveAccount(null);
        console.error('Failed to fetch active account:', error);
      }
    };
    fetchActiveAccount();
  }, [activeUser]);

  const handleSelectUser = useCallback(async (userId: number) => {
    try {
      const user = await API.setActiveUser(userId);
      setUsers((currentUsers) => mergeUser(currentUsers, user));
      setActiveUser(user);
      pushToast({ text: `Switched to ${user.username}`, level: 'success' });
    } catch (error) {
      pushToast({ text: toErrorMessage(error, 'Failed to select user'), level: 'error' });
      console.error('Failed to select user:', error);
    }
  }, [pushToast]);

  const handleRemoveUser = useCallback(async (userId: number) => {
    try {
      await API.removeUser(userId);
      await fetchUsers();
      pushToast({ text: 'User removed', level: 'warning' });
    } catch (error) {
      pushToast({ text: toErrorMessage(error, 'Failed to remove user'), level: 'error' });
      console.error('Failed to remove user:', error);
    }
  }, [fetchUsers, pushToast]);

  const handleSelectAccount = useCallback(async (accountId: string) => {
    try {
      const account = await API.setActiveAccount(accountId);
      setActiveAccount(account);
      pushToast({ text: `Switched to @${account.username}`, level: 'success' });
    } catch (error) {
      pushToast({ text: toErrorMessage(error, 'Failed to select account'), level: 'error' });
      console.error('Failed to select account:', error);
    }
  }, [pushToast]);

  const handleAddUser = useCallback(async (username: string, userId: number) => {
    const user = await API.addUser(username, userId);
    setUsers((currentUsers) => mergeUser(currentUsers, user));
    setActiveUser(user);
    pushToast({ text: `Added ${username}`, level: 'success' });
  }, [pushToast]);

  return {
    users,
    activeUser,
    activeAccount,
    handleSelectUser,
    handleRemoveUser,
    handleSelectAccount,
    handleAddUser,
  };
}
