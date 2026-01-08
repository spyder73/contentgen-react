import { ClipStyleConfig } from './types';

export const standardStyle: ClipStyleConfig = {
  id: 'standard',
  name: 'Standard',
  description: 'Classic video format with front text and images',
  metadataFields: [
    { key: 'frontText', label: 'Front Text', type: 'textarea', description: 'One line per row' },
    { key: 'frontVid', label: 'Front Video', type: 'select-media' },
    { key: 'frontVidDuration', label: 'Front Video Duration', type: 'text', placeholder: '3' },
    { key: 'POV', label: 'POV', type: 'text', placeholder: '1' },
    { key: 'partTwo', label: 'Part Two Text', type: 'textarea' },
    { key: 'totalDuration', label: 'Total Duration', type: 'text', placeholder: '30' },
  ],
  mediaMetadataFields: {
    image: [
      { key: 'text', label: 'Overlay Text', type: 'text' },
      { key: 'textPosition', label: 'Text Position', type: 'select', options: ['top', 'center', 'bottom'] },
    ],
    ai_video: [
      { key: 'text', label: 'Overlay Text', type: 'text' },
      { key: 'textPosition', label: 'Text Position', type: 'select', options: ['top', 'center', 'bottom'] },
    ],
    audio: [],
  },
};