import axios from 'axios';
import { BASE_URL } from './helpers';
import {
  AIModel,
  ModelConstraintsResponse,
  ModelsResponse,
  ModelType,
  ModelConstraintsRawResponse
} from './structs/model';

// ==================== Params ====================

interface GetModelsParams {
  provider?: string;
  type?: ModelType;
}

// ==================== Helpers ====================

const dedupeById = (models: AIModel[]): AIModel[] =>
  Array.from(new Map(models.map((m) => [m.id, m])).values());

const getProviderResponseKey = (provider: string): string | undefined => {
  if (provider === 'openrouter') return 'openrouter';
  if (provider === 'runware') return 'runware';
  return undefined;
};

// ==================== Constraints cache ====================

const constraintsCache = new Map<string, ModelConstraintsResponse>();

// ==================== API ====================

const getModels = async (params: GetModelsParams = {}): Promise<ModelsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.provider) queryParams.set('provider', params.provider);
  if (params.type) queryParams.set('type', params.type);

  const query = queryParams.toString();
  const url = query ? `${BASE_URL}/models?${query}` : `${BASE_URL}/models`;

  return axios.get(url).then((res) => res.data);
};

const getModelsForProvider = async (
  provider: string,
  type?: ModelType
): Promise<AIModel[]> => {
  const response = await getModels({ provider, type });
  const responseKey = getProviderResponseKey(provider);

  const recommended = (response.recommended || []).filter(
    (m) => m.provider === provider && (!type || m.type === type)
  );
  const providerModels = responseKey ? (response[responseKey] || []) : [];

  return dedupeById([...recommended, ...providerModels]);
};

const getChatModels = async (): Promise<AIModel[]> => {
  const response = await getModels({ type: 'chat' });

  const recommended = (response.recommended || []).filter((m) => m.type === 'chat');
  const openrouter = (response.openrouter || []).filter((m) => m.type === 'chat');

  return dedupeById([...recommended, ...openrouter]);
};

const getImageModels = async (provider?: string): Promise<AIModel[]> => {
  if (provider) return getModelsForProvider(provider, 'image');

  const response = await getModels({ type: 'image' });

  const recommended = (response.recommended || []).filter((m) => m.type === 'image');
  const openrouter = (response.openrouter || []).filter((m) => m.type === 'image');
  const runware = (response.runware || []).filter((m) => m.type === 'image');

  return dedupeById([...recommended, ...openrouter, ...runware]);
};

const getVideoModels = async (provider?: string): Promise<AIModel[]> => {
  if (provider) return getModelsForProvider(provider, 'video');

  const response = await getModels({ type: 'video' });

  const recommended = (response.recommended || []).filter((m) => m.type === 'video');
  const runware = (response.runware || []).filter((m) => m.type === 'video');

  return dedupeById([...recommended, ...runware]);
};

const getAudioModels = async (provider?: string): Promise<AIModel[]> => {
  if (provider) return getModelsForProvider(provider, 'audio');

  const response = await getModels({ type: 'audio' });

  const recommended = (response.recommended || []).filter((m) => m.type === 'audio');
  const runware = (response.runware || []).filter((m) => m.type === 'audio');

  return dedupeById([...recommended, ...runware]);
};

const getModelConstraints = async (
  modelId: string,
  modality: 'image' | 'video' | 'audio' = 'image',
  useCache = true
): Promise<ModelConstraintsResponse> => {
  const cacheKey = `${modelId}::${modality}`;
  if (useCache && constraintsCache.has(cacheKey)) {
    return constraintsCache.get(cacheKey)!;
  }

  const raw = await axios
    .get<ModelConstraintsRawResponse>(
      `${BASE_URL}/models/${encodeURIComponent(modelId)}/constraints`
    )
    .then((res) => res.data);

  // Extract the modality-specific fields block
  const modalityBlock = raw.constraints?.[modality];
  const result: ModelConstraintsResponse = {
    model_id: raw.model_id,
    fields: modalityBlock?.fields ?? {},
    capabilities:
      typeof modalityBlock?.capabilities === 'object' && modalityBlock.capabilities !== null
        ? (modalityBlock.capabilities as Record<string, unknown>)
        : {},
  };

  constraintsCache.set(cacheKey, result);
  return result;
};

const clearConstraintsCache = () => constraintsCache.clear();

// ==================== Export ====================

const ModelsAPI = {
  getModels,
  getModelsForProvider,
  getChatModels,
  getImageModels,
  getVideoModels,
  getAudioModels,
  getModelConstraints,
  clearConstraintsCache,
};

export default ModelsAPI;
