import axios from 'axios';
import { API_BASE_URL } from './helpers';

class MusicAPI {
  static async createMusicPrompt(prompt: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/new-music-prompt`, {
      prompt
    });
  }

  static async getMusicPrompts(): Promise<any[]> {
    const response = await axios.get(`${API_BASE_URL}/get-music-prompts`);
    return response.data.music_prompts || [];
  }
}

export default MusicAPI;