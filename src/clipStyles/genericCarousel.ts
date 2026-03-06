import { ClipStyleConfig } from './types';

export const genericCarouselStyle: ClipStyleConfig = {
  id: 'genericCarousel',
  name: 'genericCarousel',
  description: 'Carousel Instagram Post',
  metadataFields: [
    { key: 'brandingTag', label: 'Instagram @', type: 'text', description: '@instagram' },
    { key: 'headline', label: 'Headline', type: 'textarea', description: "Write the headline" },
    { key: 'actionText', label: 'Action Text', type: 'text', placeholder: 'Swipe for more' },
    { key: 'callToAction', label: 'Last Slide Call To Action', type: 'textarea' },
  ],
  mediaMetadataFields: {
    image: [
      { key: 'title', label: 'Slide Title', type: 'text' },
      { key: 'explanation', label: 'Slide explanation', type: 'textarea', placeholder: 'Explain the Slide Title' },
    ],
    ai_video: [],
    audio: [],
  },
};