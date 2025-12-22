import axios from 'axios';
import { API_BASE_URL } from './helpers';
import { ModelsResponse, User, UsersResponse, Account, ScheduleResponse } from './structs';

class ExternalAPI {
  // Models
  static async getModels(): Promise<ModelsResponse> {
    const response = await axios.get(`${API_BASE_URL}/models`);
    return response.data;
  }

  // Users
  static async addUser(username: string, userID: number): Promise<User> {
    const response = await axios.post(`${API_BASE_URL}/users/add`, {
      username: username,
      user_id: userID
    });
    return response.data;
  }

  static async getUsers(): Promise<UsersResponse> {
    const response = await axios.get(`${API_BASE_URL}/users`);
    return response.data;
  }

  static async setActiveUser(userID: number): Promise<User> {
    const response = await axios.post(`${API_BASE_URL}/users/set-active`, {
      user_id: userID
    });
    return response.data;
  }

  static async removeUser(userID: number): Promise<void> {
    await axios.post(`${API_BASE_URL}/users/remove`, {
      user_id: userID
    });
  }

  static async refreshAccounts(): Promise<UsersResponse> {
    const response = await axios.post(`${API_BASE_URL}/users/refresh-accounts`);
    return response.data;
  }

  // Account
  static async getActiveAccount(): Promise<Account | null> {
    const response = await axios.get(`${API_BASE_URL}/active-account`);
    return response.data.active_account;
  }

  static async setActiveAccount(accountID: string): Promise<Account> {
    const response = await axios.post(`${API_BASE_URL}/set-active-account`, {
      account_id: accountID
    });
    return response.data;
  }

  // Schedule
  static async scheduleClip(clipID: string, platforms: string[]): Promise<ScheduleResponse> {
    const response = await axios.post(`${API_BASE_URL}/schedule-video`, {
      clip_id: clipID,
      platforms: platforms
    });
    return response.data;
  }
}

export default ExternalAPI;