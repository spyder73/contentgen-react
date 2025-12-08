import axios from 'axios';

const API_BASE_URL = 'http://localhost:81';

export interface Idea {
  id: string;
  video_idea: string;
  video_prompt_json: string;
}

export interface FrontTextWithMedia {
  frontText: string[];
  frontVid: string;
  POV: string;
}

export interface EndText {
  partTwo: string;
}

export interface VidDuration {
  totalDuration: string;
  frontVidDuration: string;
}

export interface ImagePrompt {
  id: string;
  prompt: string;
  file_url: string;
  text: string;
}

export interface VideoPrompt {
  id: string;
  image_prompts: ImagePrompt[];
  front_text?: FrontTextWithMedia;
  partTwo?: EndText;
  totalDuration?: VidDuration;
  file_url?: string;
}

export interface AvailableMedia {
  media_files: string[];
}

export interface Proxy {
  id: string;
  host: string;
  port: string;
  username?: string;
  password?: string;
  type: 'http' | 'https';
  failure_count: number;
}

export interface AutopostingProperties {
  enabled: boolean;
  posting_frequency?: string;
  daily_posts?: Record<string, number>;
  downtime_hours?: number;
  downtime_start?: string;
  downtime_end?: string;
}

export interface Account {
  _id: string;
  username: string;
  platforms: string[];
  is_ai: boolean;
  autoposting_properties: AutopostingProperties;
  scheduled_times: string[];
}

export interface User {
  id: number;
  username: string;
  accounts: Account[];
}

export interface UsersResponse {
  users: User[];
  active_user: User | null;
}

export interface ScheduleResponse {
  success: boolean;
  message?: string;
  scheduled_date?: string;
  warnings?: string[];
  error?: string;
}

export interface ModelPricing {
  prompt: string;
  completion: string;
}

export interface AIModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: ModelPricing;
}

export interface ModelsResponse {
  recommended: AIModel[];
  all?: AIModel[];
}

// Helper to construct full image URLs with optional cache busting
export function constructImageUrl(filePath: string, cacheBuster?: number): string {
  const url = `${API_BASE_URL}${filePath}`;
  if (cacheBuster) {
    return `${url}?t=${cacheBuster}`;
  }
  return url;
}

// Helper to parse user ID (remove dots: 1.2.3.4 -> 1234)
export function parseUserID(input: string): number {
  const cleaned = input.replace(/\./g, '');
  return parseInt(cleaned, 10);
}

class API {
  // Ideas
  static async createNewPrompt(videoIdea: string, provider?: string, model?: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/new-video-prompt-idea`, {
      video_idea: videoIdea,
      provider,
      model
    });
  }

  static async createMultiplePrompts(promptText: string, provider?: string, model?: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/new-video-prompt-ideas`, {
      video_idea: promptText,
      provider,
      model
    });
  }

  static async getIdeas(): Promise<Idea[]> {
    const response = await axios.get(`${API_BASE_URL}/get-all-video-prompt-ideas`);
    return response.data.prompt_ideas || [];
  }

  static async deleteIdea(videoIdea: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/delete-video-prompt-idea`, { 
      data: { video_idea: videoIdea }
    });
  }

  // Video Prompts
  static async createVideoPromptFromJson(jsonObject: any): Promise<void> {
    await axios.post(`${API_BASE_URL}/new-prompt`, jsonObject, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  static async createVideoPrompt(videoPromptJson: string): Promise<void> {
    const parsed = JSON.parse(videoPromptJson);
    await this.createVideoPromptFromJson(parsed);
  }

  static async getVideoPrompts(): Promise<VideoPrompt[]> {
    const response = await axios.get(`${API_BASE_URL}/get-all-prompts`);
    return response.data.video_prompts || [];
  }

  static async getVideoPrompt(videoPromptId: string): Promise<VideoPrompt> {
    const response = await axios.get(`${API_BASE_URL}/get-prompt/${videoPromptId}`);
    return response.data.video_prompt;
  }

  static async editVideoPrompt(
    videoPromptId: string, 
    frontText: FrontTextWithMedia, 
    endText: EndText, 
    vidDuration: VidDuration
  ): Promise<void> {
    await axios.post(`${API_BASE_URL}/edit-video-prompt/${videoPromptId}`, {
      frontText: frontText,
      endText: endText,
      vidDuration: vidDuration
    });
  }

  static async deleteVideoPrompt(videoPromptId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/delete-video-prompt/${videoPromptId}`);
  }

  // Image Prompts
  static async createImagePrompt(videoId: string, newPromptString: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/new-image-prompt`, { 
      video_id: videoId,
      new_prompt_string: newPromptString
    });
  }

  static async editImagePrompt(imagePromptId: string, newPromptString: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/edit-image-prompt/${imagePromptId}`, { 
      new_prompt_string: newPromptString 
    });
  }

  static async editImageText(imagePromptId: string, newPromptString: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/edit-image-text/${imagePromptId}`, { 
      new_prompt_string: newPromptString 
    });
  }

  static async regenerateImage(imagePromptId: string): Promise<void> {
    await axios.get(`${API_BASE_URL}/regenerate-image/${imagePromptId}`);
  }

  static async deleteImagePrompt(imagePromptId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/delete-image-prompt/${imagePromptId}`);
  }

  // Available Media
  static async getAvailableMedia(): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/get-available-media`);
    return response.data.media_files || [];
  }

  // Proxies
  static async getProxies(): Promise<Proxy[]> {
    const response = await axios.get(`${API_BASE_URL}/proxies`);
    return response.data.proxies || [];
  }

  static async addProxy(proxyString: string, type: 'http' | 'https'): Promise<Proxy> {
    const response = await axios.post(`${API_BASE_URL}/proxies`, { 
      proxy: proxyString,
      type: type
    });
    return response.data;
  }

  static async deleteProxy(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/proxies/${id}`);
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
  static async scheduleVideo(videoID: string, platforms: string[]): Promise<ScheduleResponse> {
    const response = await axios.post(`${API_BASE_URL}/schedule-video`, {
      video_id: videoID,
      platforms: platforms
    });
    return response.data;
  }

  // Models
  static async getModels(): Promise<ModelsResponse> {
    const response = await axios.get(`${API_BASE_URL}/models`);
    return response.data;
  }
}

export default API;