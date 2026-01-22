import axios from 'axios';
import { BASE_URL } from './helpers';
import { AIModel, ModelsResponse, ModelType } from './structs/model';
import { Provider, getProviderResponseKey } from './structs/providers';

interface GetModelsParams {
  provider?: string;
  type?: ModelType;
}

const getModels = async (params: GetModelsParams): Promise<ModelsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.provider) queryParams.set('provider', params.provider);
  if (params.type) queryParams.set('type', params.type);
  
  const query = queryParams.toString();
  const url = query ? `${BASE_URL}/models?${query}` : `${BASE_URL}/models`;
  
  return axios.get(url).then((res) => res.data);
};

/** Get models for a specific provider, including recommended ones */
const getModelsForProvider = async (
  provider: Provider,
  type?: ModelType
): Promise<AIModel[]> => {
  const params: GetModelsParams = {};
  if (type) params.type = type;
  
  const response = await getModels(params);
  const responseKey = getProviderResponseKey(provider);
  
  // Combine recommended (filtered by provider) + provider-specific
  const recommended = response.recommended?.filter(m => m.provider === provider) || [];
  const providerModels = responseKey ? response[responseKey] || [] : [];
  
  // Deduplicate by ID
  const combined = [...recommended, ...providerModels];
  return Array.from(new Map(combined.map(m => [m.id, m])).values());
};

/** Get all chat models (text output) */
const getChatModels = async (): Promise<AIModel[]> => {
  const response = await getModels({ type: 'chat' });
  
  const recommended = response.recommended?.filter(m => m.type === 'chat') || [];
  const openrouter = response.openrouter?.filter(m => m.type === 'chat') || [];
  
  const combined = [...recommended, ...openrouter];
  return Array.from(new Map(combined.map(m => [m.id, m])).values());
};

/** Get all image models */
const getImageModels = async (provider?: Provider): Promise<AIModel[]> => {
  if (provider) {
    return getModelsForProvider(provider, 'image');
  }
  
  const response = await getModels({ type: 'image' });
  
  const recommended = response.recommended?.filter(m => m.type === 'image') || [];
  const openrouter = response.openrouter || [];
  const runware = response.runware?.filter(m => m.type === 'image') || [];
  
  const combined = [...recommended, ...openrouter, ...runware];
  return Array.from(new Map(combined.map(m => [m.id, m])).values());
};

/** Get all video models */
const getVideoModels = async (provider?: Provider): Promise<AIModel[]> => {
  if (provider) {
    return getModelsForProvider(provider, 'video');
  }
  
  const response = await getModels({ type: 'video' });
  
  const recommended = response.recommended?.filter(m => m.type === 'video') || [];
  const runware = response.runware?.filter(m => m.type === 'video') || [];
  
  const combined = [...recommended, ...runware];
  return Array.from(new Map(combined.map(m => [m.id, m])).values());
};

const ModelsAPI = {
  getModels,
  getModelsForProvider,
  getChatModels,
  getImageModels,
  getVideoModels,
};

export default ModelsAPI;