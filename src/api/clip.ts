import axios from 'axios';
import { API_BASE_URL } from './helpers';
import { 
  Idea, 
  ClipPrompt, 
  FrontTextWithMedia, 
  EndText, 
  ClipDuration,
  ImageGenerator,
  VideoGenerator
} from './structs';

class ClipAPI {
  // Ideas
  static async createNewIdea(clipIdea: string, provider?: string, model?: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/new-clip-prompt-idea`, {
      clip_idea: clipIdea,
      provider,
      model
    });
  }

  static async createMultipleIdeas(clipsIdea: string, provider?: string, model?: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/new-clip-prompt-ideas`, {
      clip_idea: clipsIdea,
      provider,
      model
    });
  }

  static async getIdeas(): Promise<Idea[]> {
    const response = await axios.get(`${API_BASE_URL}/get-all-clip-prompt-ideas`);
    return response.data.prompt_ideas || [];
  }

  static async deleteIdea(clipIdea: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/delete-clip-prompt-idea`, { 
      data: { clip_idea: clipIdea }
    });
  }

  // Clip Prompts
  static async createClipPromptFromJson(
    jsonObject: any,
    generator?: ImageGenerator,
    videoGenerator?: VideoGenerator,
    model?: string
  ): Promise<void> {
    await axios.post(`${API_BASE_URL}/new-prompt`, {
      ...jsonObject,
      generator,
      videoGenerator,
      model
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  static async createClipPrompt(
    clipPromptJson: string,
    generator?: ImageGenerator,
    videoGenerator?: VideoGenerator,
    model?: string
  ): Promise<void> {
    const parsed = JSON.parse(clipPromptJson);
    await this.createClipPromptFromJson(parsed, generator, videoGenerator, model);
  }

  static async getClipPrompts(): Promise<ClipPrompt[]> {
    const response = await axios.get(`${API_BASE_URL}/get-all-prompts`);
    return response.data.clip_prompts || [];
  }

  static async getClipPrompt(clipPromptId: string): Promise<ClipPrompt> {
    const response = await axios.get(`${API_BASE_URL}/get-prompt/${clipPromptId}`);
    return response.data.clip_prompt;
  }

  static async editClipPrompt(
    clipPromptId: string, 
    frontText: FrontTextWithMedia, 
    endText: EndText, 
    clipDuration: ClipDuration
  ): Promise<void> {
    await axios.post(`${API_BASE_URL}/edit-clip-prompt/${clipPromptId}`, {
      frontText: frontText,
      endText: endText,
      clipDuration: clipDuration
    });
  }

  static async deleteClipPrompt(clipPromptId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/delete-clip-prompt/${clipPromptId}`);
  }

  // Available Media
  static async getAvailableMedia(): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/get-available-media`);
    return response.data.media_files || [];
  }
}

export default ClipAPI;