import axios from 'axios';
import { BASE_URL } from './helpers';

const getProxies = () =>
  axios.get(`${BASE_URL}/proxies`).then((res) => res.data);

const addProxy = (proxy: string, type: string) =>
  axios.post(`${BASE_URL}/proxies`, { proxy, type }).then((res) => res.data);

const deleteProxy = (proxyId: string) =>
  axios.delete(`${BASE_URL}/proxies/${proxyId}`).then((res) => res.data);

const ProxyAPI = {
  getProxies,
  addProxy,
  deleteProxy,
};

export default ProxyAPI;