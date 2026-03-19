import axios from 'axios';
import { BASE_URL } from './helpers';
import { ScheduleResponse } from './structs/user';
import {
  isRouteFallbackError,
  normalizeActiveAccount,
  normalizeScheduleResponse,
  normalizeUser,
  normalizeUsersResponse,
  toApiError,
} from './externalHelpers';

// ==================== Users ====================

const requestWithFallback = async <T>(
  paths: string[],
  request: (path: string) => Promise<T>,
  fallbackMessage: string
): Promise<T> => {
  let latestError: unknown = null;

  for (let index = 0; index < paths.length; index += 1) {
    const path = paths[index];
    try {
      return await request(path);
    } catch (error) {
      latestError = error;
      const isLastPath = index === paths.length - 1;
      if (!isLastPath && isRouteFallbackError(error)) {
        continue;
      }
      throw toApiError(error, fallbackMessage);
    }
  }

  throw toApiError(latestError, fallbackMessage);
};

const getUsers = () =>
  requestWithFallback(
    ['/v1/users', '/users'],
    async (path) => {
      const response = await axios.get(`${BASE_URL}${path}`);
      return normalizeUsersResponse(response.data);
    },
    'Failed to fetch users'
  );

const addUser = (user_name: string, userId: number) =>
  requestWithFallback(
    ['/v1/users', '/users'],
    async (path) => {
      const response = await axios.post(`${BASE_URL}${path}`, { username: user_name, user_id: userId });
      const user = normalizeUser(response.data);
      if (!user) {
        throw new Error('Invalid add user response');
      }
      return user;
    },
    'Failed to add user'
  );

const setActiveUser = (userId: number) =>
  requestWithFallback(
    ['/v1/users/active', '/users/active'],
    async (path) => {
      const response = await axios.post(`${BASE_URL}${path}`, { user_id: userId });
      const user = normalizeUser(response.data);
      if (!user) {
        throw new Error('Invalid active user response');
      }
      return user;
    },
    'Failed to set active user'
  );

const removeUser = (userId: number) =>
  requestWithFallback(
    [`/v1/users/${userId}`, `/users/${userId}`],
    async (path) => {
      const response = await axios.delete(`${BASE_URL}${path}`);
      return response.data;
    },
    'Failed to remove user'
  );

const refreshAccounts = () =>
  requestWithFallback(
    ['/v1/users/refresh-accounts', '/users/refresh-accounts'],
    async (path) => {
      const response = await axios.post(`${BASE_URL}${path}`);
      return normalizeUsersResponse(response.data);
    },
    'Failed to refresh accounts'
  );

// ==================== Accounts ====================

const getActiveAccount = () =>
  requestWithFallback(
    ['/v1/accounts/active', '/accounts/active'],
    async (path) => {
      const response = await axios.get(`${BASE_URL}${path}`);
      return normalizeActiveAccount(response.data);
    },
    'Failed to fetch active account'
  );

const setActiveAccount = (accountId: string) =>
  requestWithFallback(
    ['/v1/accounts/active', '/accounts/active'],
    async (path) => {
      const response = await axios.post(`${BASE_URL}${path}`, { account_id: accountId });
      const account = normalizeActiveAccount(response.data);
      if (!account) {
        throw new Error('Invalid active account response');
      }
      return account;
    },
    'Failed to set active account'
  );

// ==================== Prompt Enhancement ====================

const enhancePrompt = async (userIdea: string, provider: string, model: string): Promise<string> => {
  const response = await axios.post(`${BASE_URL}/enhance-prompt`, { user_idea: userIdea, provider, model });
  return response.data.enhanced_idea as string;
};

// ==================== Scheduling ====================

interface ScheduleClipRequest {
  clip_id: string;
  platforms: string[];
}

const scheduleClip = async (clipId: string, platforms: string[]): Promise<ScheduleResponse> => {
  const request: ScheduleClipRequest = {
    clip_id: clipId,
    platforms,
  };

  return requestWithFallback(
    ['/v1/schedule', '/schedule', '/scheduler/runs'],
    async (path) => {
      const response = await axios.post(`${BASE_URL}${path}`, request);
      return normalizeScheduleResponse(response.data);
    },
    'Failed to schedule clip'
  );
};

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
  enhancePrompt,
};

export default ExternalAPI;
