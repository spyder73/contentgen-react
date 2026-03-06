import { ClipStyleConfig } from './types';

export const medievalStyle: ClipStyleConfig = {
  id: 'medieval',
  name: 'Medieval',
  description: 'Medieval themed reel with stylized text and slides',
  metadataFields: [
    { key: 'frontText', label: 'Front Text', type: 'textarea', description: 'One line per row' },
    { key: 'frontVidDuration', label: 'Intro Duration (s)', type: 'text', placeholder: '3' },
    { key: 'POV', label: 'POV', type: 'select', options: ['0', '1'], description: '1 = show POV: prefix' },
    { key: 'partTwo', label: 'End Text', type: 'textarea' },
    { key: 'totalDuration', label: 'Total Duration (s)', type: 'text', placeholder: '18' },
    { key: 'musicUrl', label: 'Music File', type: 'text', placeholder: 'song.mp3' },
  ],
  mediaMetadataFields: {
    image: [
      { key: 'text', label: 'Overlay Text', type: 'text' },
      { key: 'position', label: 'Text Position', type: 'select', options: ['top', 'bottom'] },
      { key: 'order', label: 'Order', type: 'text', placeholder: 'auto' },
    ],
    ai_video: [
      { key: 'text', label: 'Overlay Text', type: 'text' },
      { key: 'position', label: 'Text Position', type: 'select', options: ['top', 'bottom'] },
      { key: 'type', label: 'Role', type: 'select', options: ['slide', 'intro'] },
      { key: 'order', label: 'Order', type: 'text', placeholder: 'auto' },
      { key: 'duration', label: 'Duration (s)', type: 'text', placeholder: '3' },
    ],
    audio: [],
  },
};
