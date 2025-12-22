import axios from 'axios';
import { API_BASE_URL } from './helpers';

interface UpscalingStatus {
  enabled: boolean;
  current_task?: string;
  progress?: number;
}

interface UpscalingConfig {
  enabled: boolean;
  scale_factor?: number;
  model?: string;
}

class UpscalerAPI {
  static async getUpscalingStatus(): Promise<UpscalingStatus> {
    const response = await axios.get(`${API_BASE_URL}/upscaling-status`);
    return response.data;
  }

  static async updateUpscalingConfig(config: UpscalingConfig): Promise<void> {
    await axios.post(`${API_BASE_URL}/update-upscaling-config`, config);
  }
}

export default UpscalerAPI;