import axios from 'axios';
import { API_BASE_URL } from './helpers';
import { Proxy } from './structs';

class ProxyAPI {
  static async getProxies(): Promise<Proxy[]> {
    const response = await axios.get(`${API_BASE_URL}/proxies`);
    return response.data.proxies || [];
  }

  static async addProxy(proxyString: string, type: 'http' | 'https'): Promise<Proxy> {
    const response = await axios.post(`${API_BASE_URL}/proxies`, { 
      proxy: proxyString,
      type: type
    });
    return response.data;
  }

  static async deleteProxy(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/proxies/${id}`);
  }
}

export default ProxyAPI;