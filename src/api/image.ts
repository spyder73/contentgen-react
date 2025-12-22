import axios from 'axios';
import { API_BASE_URL } from './helpers';
import { ImageGenerator } from './structs';

class ImageAPI {
  static async createImagePrompt(
    clipId: string, 
    newPromptString: string,
    generator?: ImageGenerator,
    model?: string
  ): Promise<void> {
    await axios.post(`${API_BASE_URL}/new-image-prompt`, { 
      clip_id: clipId,
      new_prompt_string: newPromptString,
      generator,
      model
    });
  }

  static async editImagePrompt(
    imagePromptId: string, 
    newPromptString: string,
    generator?: ImageGenerator,
    model?: string
  ): Promise<void> {
    await axios.post(`${API_BASE_URL}/edit-image-prompt/${imagePromptId}`, { 
      new_prompt_string: newPromptString,
      generator,
      model
    });
  }

  static async editImageText(imagePromptId: string, newText: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/edit-image-text/${imagePromptId}`, { 
      new_text: newText
    });
  }

  static async regenerateImage(
    imagePromptId: string,
    generator?: ImageGenerator,
    model?: string
  ): Promise<void> {
    await axios.post(`${API_BASE_URL}/regenerate-image/${imagePromptId}`, {
      generator,
      model
    });
  }

  static async deleteImagePrompt(imagePromptId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/delete-image-prompt/${imagePromptId}`);
  }
}

export default ImageAPI;