import ClipAPI from './clip';
import ImageAPI from './image';
import MusicAPI from './music';
import ProxyAPI from './proxy';
import ExternalAPI from './external';
import UpscalerAPI from './upscaler';

// Unified API object for backward compatibility
const API = {
  // Clip
  createNewIdea: ClipAPI.createNewIdea,
  createMultipleIdeas: ClipAPI.createMultipleIdeas,
  getIdeas: ClipAPI.getIdeas,
  deleteIdea: ClipAPI.deleteIdea,
  createClipPromptFromJson: ClipAPI.createClipPromptFromJson,
  createClipPrompt: ClipAPI.createClipPrompt,
  getClipPrompts: ClipAPI.getClipPrompts,
  getClipPrompt: ClipAPI.getClipPrompt,
  editClipPrompt: ClipAPI.editClipPrompt,
  deleteClipPrompt: ClipAPI.deleteClipPrompt,
  getAvailableMedia: ClipAPI.getAvailableMedia,

  // Image
  createImagePrompt: ImageAPI.createImagePrompt,
  editImagePrompt: ImageAPI.editImagePrompt,
  editImageText: ImageAPI.editImageText,
  regenerateImage: ImageAPI.regenerateImage,
  deleteImagePrompt: ImageAPI.deleteImagePrompt,

  // Music
  createMusicPrompt: MusicAPI.createMusicPrompt,
  getMusicPrompts: MusicAPI.getMusicPrompts,

  // Proxy
  getProxies: ProxyAPI.getProxies,
  addProxy: ProxyAPI.addProxy,
  deleteProxy: ProxyAPI.deleteProxy,

  // External
  getModels: ExternalAPI.getModels,
  addUser: ExternalAPI.addUser,
  getUsers: ExternalAPI.getUsers,
  setActiveUser: ExternalAPI.setActiveUser,
  removeUser: ExternalAPI.removeUser,
  refreshAccounts: ExternalAPI.refreshAccounts,
  getActiveAccount: ExternalAPI.getActiveAccount,
  setActiveAccount: ExternalAPI.setActiveAccount,
  scheduleClip: ExternalAPI.scheduleClip,

  // Upscaler
  getUpscalingStatus: UpscalerAPI.getUpscalingStatus,
  updateUpscalingConfig: UpscalerAPI.updateUpscalingConfig,
};

export default API;

// Re-export individual APIs for direct access
export { ClipAPI, ImageAPI, MusicAPI, ProxyAPI, ExternalAPI, UpscalerAPI };

// Re-export structs and helpers
export * from './structs';
export * from './helpers';