import axios from 'axios';
import { BASE_URL } from './helpers';

interface UpscalingConfig {
  enabled?: boolean;
  model?: string;
  scale?: number;
}

const getUpscalingStatus = () =>
  axios.get(`${BASE_URL}/upscaling/status`).then((res) => res.data);

const updateUpscalingConfig = (config: UpscalingConfig) =>
  axios.put(`${BASE_URL}/upscaling/config`, config).then((res) => res.data);

const UpscalerAPI = {
  getUpscalingStatus,
  updateUpscalingConfig,
};

export default UpscalerAPI;