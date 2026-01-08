import axios from 'axios';
import { BASE_URL } from './helpers';

const createMusicPrompt = (prompt: string) =>
  axios.post(`${BASE_URL}/new-music-prompt`, prompt).then((res) => res.data);

const getMusicPrompts = () =>
  axios.get(`${BASE_URL}/get-music-prompts`).then((res) => res.data);

const MusicAPI = {
  createMusicPrompt,
  getMusicPrompts,
};

export default MusicAPI;