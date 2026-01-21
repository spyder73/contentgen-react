import ClipAPI from './clip';
import MusicAPI from './music';
import ProxyAPI from './proxy';
import ExternalAPI from './external';
import UpscalerAPI from './upscaler';
import MediaAPI from './media';
import PipelineAPI from './pipeline';

// Unified API object for backward compatibility
const API = {
  // Clip
  createIdea: ClipAPI.createIdea,
  createIdeas: ClipAPI.createIdeas,
  getIdeas: ClipAPI.getIdeas,
  deleteIdea: ClipAPI.deleteIdea,
  createClipPromptFromJson: ClipAPI.createClipPromptFromJson,
  createClipPrompt: ClipAPI.createClipPrompt,
  getClipPrompts: ClipAPI.getClipPrompts,
  getClipPrompt: ClipAPI.getClipPrompt,
  editClipPrompt: ClipAPI.editClipPrompt,
  deleteClipPrompt: ClipAPI.deleteClipPrompt,
  getAvailableMedia: ClipAPI.getAvailableMedia,

  // Media
  getMediaItem: MediaAPI.getMediaItem,
  createMediaItem: MediaAPI.createMediaItem,
  createImage: MediaAPI.createImage,
  createAIVideo: MediaAPI.createAIVideo,
  createAudio: MediaAPI.createAudio,
  editMediaItem: MediaAPI.editMediaItem,
  regenerateMedia: MediaAPI.regenerateMedia,
  editMediaMetadata: MediaAPI.editMediaMetadata,
  replaceMediaMetadata: MediaAPI.replaceMediaMetadata,
  deleteMediaItem: MediaAPI.deleteMediaItem,

  // Pipeline Runs
  startPipeline: PipelineAPI.startPipeline,
  getPipeline: PipelineAPI.getPipeline,
  listPipelines: PipelineAPI.listPipelines,
  continuePipeline: PipelineAPI.continuePipeline,
  regenerateCheckpoint: PipelineAPI.regenerateCheckpoint,
  addPipelineAttachment: PipelineAPI.addAttachment,
  cancelPipeline: PipelineAPI.cancelPipeline,

  // Pipeline Templates
  createPipelineTemplate: PipelineAPI.createPipelineTemplate,
  getPipelineTemplate: PipelineAPI.getPipelineTemplate,
  listPipelineTemplates: PipelineAPI.listPipelineTemplates,
  updatePipelineTemplate: PipelineAPI.updatePipelineTemplate,
  deletePipelineTemplate: PipelineAPI.deletePipelineTemplate,

  // Prompt Templates
  createPromptTemplate: PipelineAPI.createPromptTemplate,
  getPromptTemplate: PipelineAPI.getPromptTemplate,
  listPromptTemplates: PipelineAPI.listPromptTemplates,
  updatePromptTemplate: PipelineAPI.updatePromptTemplate,
  deletePromptTemplate: PipelineAPI.deletePromptTemplate,

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
export { ClipAPI, MediaAPI, MusicAPI, ProxyAPI, ExternalAPI, UpscalerAPI, PipelineAPI };

// Re-export structs and helpers
export * from './structs';
export * from './helpers';