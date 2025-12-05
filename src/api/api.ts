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

// Helper to construct full image URLs with optional cache busting (to reload video if it changed)
export function constructImageUrl(filePath: string, cacheBuster?: number): string {
  const url = `${API_BASE_URL}${filePath}`;
  if (cacheBuster) {
    return `${url}?t=${cacheBuster}`;
  }
  return url;
}

class API {
  // Ideas (Video Prompt Ideas)
  static async createNewPrompt(videoIdea: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/new-video-prompt-idea`, { 
      video_idea: videoIdea
    });
  }

  // Create multiple ideas at once (e.g., "Generate 10 video ideas")
  static async createMultiplePrompts(promptText: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/new-video-prompt-ideas`, { 
      video_idea: promptText
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

  // Video Prompts - Create from Idea's JSON (already parsed)
  static async createVideoPromptFromJson(jsonObject: any): Promise<void> {
    await axios.post(`${API_BASE_URL}/new-prompt`, jsonObject, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Legacy: Create from JSON string
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
}

export default API;