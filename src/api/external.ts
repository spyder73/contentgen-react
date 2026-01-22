import axios from 'axios';
import { BASE_URL } from './helpers';

// ==================== Users ====================

const getUsers = () =>
  axios.get(`${BASE_URL}/users`).then((res) => res.data);

const addUser = (user_name: string, userId: number) =>
  axios.post(`${BASE_URL}/users`, {username: user_name, user_id: userId }).then((res) => res.data);

const setActiveUser = (userId: number) =>
  axios.post(`${BASE_URL}/users/active`, { user_id: userId }).then((res) => res.data);

const removeUser = (userId: number) =>
  axios.delete(`${BASE_URL}/users/${userId}`).then((res) => res.data);

const refreshAccounts = () =>
  axios.post(`${BASE_URL}/users/refresh-accounts`).then((res) => res.data);

// ==================== Accounts ====================

const getActiveAccount = () =>
  axios.get(`${BASE_URL}/accounts/active`).then((res) => res.data.active_account);

const setActiveAccount = (accountId: string) =>
  axios.post(`${BASE_URL}/accounts/active`, { account_id: accountId }).then((res) => res.data);

// ==================== Scheduling ====================

interface ScheduleClipRequest {
  clip_id: string;
  platforms: string[];
}

const scheduleClip = (clipId: string, platforms: string[]) =>
  axios.post(`${BASE_URL}/schedule`, {
    clip_id: clipId,
    platforms,
  } as ScheduleClipRequest).then((res) => res.data);

// ==================== Export ====================

const ExternalAPI = {
  getUsers,
  addUser,
  setActiveUser,
  removeUser,
  refreshAccounts,
  getActiveAccount,
  setActiveAccount,
  scheduleClip,
};

export default ExternalAPI;