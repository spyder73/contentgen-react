# Components Documentation

## 📁 Component Structure

```
src/components/
├── clips/          # Clip management
├── ideas/          # Idea management
├── layout/         # App layout
├── modals/         # Modal dialogs
├── selectors/      # Provider/model selection
├── ui/             # Reusable primitives
└── user/           # User management
```

---

## 💡 Ideas (`/components/ideas/`)

Components for managing content ideas.

### IdeasList
Main container for the ideas panel.

```tsx
<IdeasList
  onRefresh={refreshTrigger}
  imageProvider="openrouter"
  videoProvider="runware"
  imageModel="openai/gpt-5-image-mini"
  videoModel="lightricks:2@1"
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `onRefresh` | `number` | Trigger to refresh the list |
| `imageProvider` | `ImageProvider` | Provider for image generation |
| `videoProvider` | `VideoProvider` | Provider for video generation |
| `imageModel` | `string` | Model ID for images |
| `videoModel` | `string` | Model ID for videos |

### IdeaForm
Form for creating single or bulk ideas.

```tsx
<IdeaForm
  onSubmitSingle={(idea, provider, model) => {...}}
  onSubmitBulk={(theme, provider, model) => {...}}
  isLoading={false}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `onSubmitSingle` | `(idea, provider, model) => Promise<void>` | Handler for single idea |
| `onSubmitBulk` | `(theme, provider, model) => Promise<void>` | Handler for bulk ideas |
| `isLoading` | `boolean` | Loading state |

### IdeaItem
Individual idea card with actions.

```tsx
<IdeaItem
  idea={idea}
  onCreatePrompt={(idea) => {...}}
  onDelete={(clipIdea) => {...}}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `idea` | `Idea` | The idea object |
| `onCreatePrompt` | `(idea: Idea) => void` | Create clip from idea |
| `onDelete` | `(clipIdea: string) => void` | Delete the idea |

---

## 🎬 Clips (`/components/clips/`)

Components for managing video clips.

### ClipPromptsList
Main container for the clips panel.

```tsx
<ClipPromptsList
  onRefresh={refreshTrigger}
  onTriggerRefresh={() => setRefresh(r => r + 1)}
  imageProvider="openrouter"
  imageModel="openai/gpt-5-image-mini"
  activeAccount={account}
/>
```

### ClipPromptItem
Individual clip card with expandable details.

```tsx
<ClipPromptItem
  clip={clip}
  isExpanded={true}
  onToggleExpand={() => {...}}
  onDelete={() => {...}}
  onRefresh={() => {...}}
  imageProvider="openrouter"
  imageModel="model-id"
  activeAccount={account}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `clip` | `ClipPrompt` | The clip object |
| `isExpanded` | `boolean` | Whether details are shown |
| `onToggleExpand` | `() => void` | Toggle expansion |
| `onDelete` | `() => void` | Delete the clip |
| `onRefresh` | `() => void` | Refresh parent list |
| `imageProvider` | `ImageProvider` | For regenerating images |
| `imageModel` | `string` | For regenerating images |
| `activeAccount` | `Account \| null` | For scheduling |

### ImagePromptItem
Image within a clip with edit/regenerate actions.

```tsx
<ImagePromptItem
  imagePrompt={imagePrompt}
  onRefresh={() => {...}}
  imageProvider="openrouter"
  imageModel="model-id"
  onPreview={(url) => {...}}
/>
```

### ClipPlayer
Video player for rendered clips.

```tsx
<ClipPlayer videoUrl="http://..." />
```

### ScheduleButton
Schedule clip to social platforms.

```tsx
<ScheduleButton
  clipId="clip-123"
  activeAccount={account}
/>
```

---

## 🎨 Layout (`/components/layout/`)

### Header
Main application header with selectors and user menu.

```tsx
<Header
  imageProvider="openrouter"
  imageModel="model-id"
  onImageProviderChange={setImageProvider}
  onImageModelChange={setImageModel}
  videoProvider="runware"
  videoModel="model-id"
  onVideoProviderChange={setVideoProvider}
  onVideoModelChange={setVideoModel}
  users={users}
  activeUser={user}
  activeAccount={account}
  onAddUser={() => {...}}
  onSelectUser={(userId) => {...}}
  onRemoveUser={(userId) => {...}}
  onSelectAccount={(accountId) => {...}}
  onOpenProxyModal={() => {...}}
/>
```

### Toast
Notification toast with auto-dismiss.

```tsx
<Toast
  message="Success!"
  onClose={() => setMessage(null)}
  duration={3000}
/>
```

---

## 🔽 Selectors (`/components/selectors/`)

### ImageProviderSelector
Select image provider and model.

```tsx
<ImageProviderSelector
  provider="openrouter"
  model="openai/gpt-5-image-mini"
  onProviderChange={setProvider}
  onModelChange={setModel}
/>
```

### VideoProviderSelector
Select video provider and model.

```tsx
<VideoProviderSelector
  provider="runware"
  model="lightricks:2@1"
  onProviderChange={setProvider}
  onModelChange={setModel}
/>
```

### ChatProviderSelector
Select chat/text provider and model.

```tsx
<ChatProviderSelector
  provider="openrouter"
  model="x-ai/grok-4-fast"
  onProviderChange={setProvider}
  onModelChange={setModel}
/>
```

---

## 🗂️ Modals (`/components/modals/`)

### Modal (Base)
Base modal component.

```tsx
<Modal isOpen={true} onClose={close} title="Title" size="md">
  {children}
</Modal>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Visibility |
| `onClose` | `() => void` | - | Close handler |
| `title` | `string` | - | Modal title |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Modal width |
| `children` | `ReactNode` | - | Modal content |

### Available Modals

| Modal | Purpose |
|-------|---------|
| `AddUserModal` | Add new user |
| `AddImagePromptModal` | Add image to clip |
| `EditClipPromptModal` | Edit clip text/duration |
| `EditImagePromptModal` | Edit image prompt |
| `EditImageTextModal` | Edit image text overlay |
| `ImagePreviewModal` | Full-size image preview |
| `ProxyModal` | Manage proxy settings |

---

## 👤 User (`/components/user/`)

### UserMenu
Dropdown menu for user/account selection.

```tsx
<UserMenu
  users={users}
  activeUser={user}
  activeAccount={account}
  onAddUser={() => {...}}
  onSelectUser={(userId) => {...}}
  onRemoveUser={(userId) => {...}}
  onSelectAccount={(accountId) => {...}}
/>
```