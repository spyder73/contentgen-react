# API Layer Documentation

The API layer handles all communication with the backend server.

## 📁 Structure

```
src/api/
├── structs/              # Type definitions
│   ├── providers.ts      # Provider & model types
│   ├── clip.ts           # Clip-related types
│   ├── model.ts          # AI model types
│   ├── user.ts           # User & account types
│   ├── proxy.ts          # Proxy configuration types
│   └── index.ts          # Re-exports
├── api.ts                # Main API facade
├── clip.ts               # Clip API service
├── image.ts              # Image API service
├── music.ts              # Music API service
├── external.ts           # External services (users, models)
├── proxy.ts              # Proxy API service
├── upscaler.ts           # Upscaler API service
└── helpers.ts            # Utility functions
```

## 🔌 Provider Types

### ImageProvider
```typescript
type ImageProvider = 'pollinations' | 'openrouter' | 'runware';
```

| Provider | Description | Models |
|----------|-------------|--------|
| `pollinations` | Free image generation | Default model only |
| `openrouter` | Multi-model API | GPT-5 Image, DALL-E, etc. |
| `runware` | Fast generation | Various models |

### VideoProvider
```typescript
type VideoProvider = 'runware';
```

| Provider | Description | Models |
|----------|-------------|--------|
| `runware` | Video generation | LTX Video, Google Veo, Haiper, etc. |

### ChatProvider
```typescript
type ChatProvider = 'openrouter' | 'google';
```

| Provider | Description | Models |
|----------|-------------|--------|
| `openrouter` | Multi-model chat | Claude, GPT-4, Grok, etc. |
| `google` | Google AI | Gemini models |

## 📊 Data Types

### Idea
```typescript
interface Idea {
  id?: string;
  clip_idea: string;
  clip_prompt_json?: string;  // Generated prompt (null while processing)
}
```

### ClipPrompt
```typescript
interface ClipPrompt {
  id: string;
  front_text?: FrontTextWithMedia;
  partTwo?: EndText;
  totalDuration?: ClipDuration;
  image_prompts?: ImagePrompt[];
  ai_video_prompts?: AIVideoPrompt[];
  file_url?: string;  // Final rendered video
}
```

### ImagePrompt
```typescript
interface ImagePrompt {
  id: string;
  prompt: string;
  text?: string;       // Text overlay
  file_url?: string;   // Generated image URL
}
```

### User & Account
```typescript
interface User {
  id: number;
  username: string;
  accounts?: Account[];
}

interface Account {
  _id: string;
  username: string;
  platforms: string[];  // ['tiktok', 'instagram', 'youtube']
  is_ai: boolean;
}
```

## 🛠️ API Services

### ClipAPI
```typescript
// Ideas
ClipAPI.createNewIdea(idea, provider?, model?)
ClipAPI.createMultipleIdeas(theme, provider?, model?)
ClipAPI.getIdeas()
ClipAPI.deleteIdea(clipIdea)

// Clip Prompts
ClipAPI.createClipPrompt(json, imageProvider?, videoProvider?, model?)
ClipAPI.getClipPrompts()
ClipAPI.getClipPrompt(id)
ClipAPI.editClipPrompt(id, frontText, endText, duration)
ClipAPI.deleteClipPrompt(id)
```

### ImageAPI
```typescript
ImageAPI.createImagePrompt(clipId, prompt, provider?, model?)
ImageAPI.editImagePrompt(id, prompt, provider?, model?)
ImageAPI.editImageText(id, text)
ImageAPI.regenerateImage(id, provider?, model?)
ImageAPI.deleteImagePrompt(id)
```

### ExternalAPI
```typescript
// Users
ExternalAPI.addUser(username, userId)
ExternalAPI.getUsers()
ExternalAPI.setActiveUser(userId)
ExternalAPI.removeUser(userId)

// Accounts
ExternalAPI.getActiveAccount()
ExternalAPI.setActiveAccount(accountId)
ExternalAPI.refreshAccounts()

// Models
ExternalAPI.getModels()

// Scheduling
ExternalAPI.scheduleClip(clipId, platforms)
```

## 🔄 WebSocket

Real-time updates via WebSocket connection:

```typescript
const wsUrl = API_BASE_URL.replace('http', 'ws') + '/ws';
const ws = new WebSocket(wsUrl);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle: image_generated, video_generated, clip_generated, idea_generated
};
```

## 🔧 Helpers

```typescript
// Base URL for API calls
export const API_BASE_URL = 'http://localhost:8000';

// Construct full media URL from relative path
export function constructMediaUrl(path: string): string;
```

## 📝 Usage Example

```typescript
import API from './api';
import { ImageProvider, ClipPrompt } from './api/structs';

// Create an idea
await API.createNewIdea('A cat playing piano', 'openrouter', 'x-ai/grok-4-fast');

// Get all ideas
const ideas = await API.getIdeas();

// Create clip from idea
await API.createClipPrompt(
  ideas[0].clip_prompt_json,
  'openrouter',  // imageProvider
  'runware',     // videoProvider
  'openai/gpt-5-image-mini'  // imageModel
);

// Get all clips
const clips: ClipPrompt[] = await API.getClipPrompts();
```