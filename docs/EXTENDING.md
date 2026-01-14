# Extending the Frontend

Guide for adding new features to the ContentGen frontend.

---

## 🆕 Adding a New Provider

### 1. Update Provider Types

```typescript
// src/api/structs/providers.ts

// Add to existing type
export type ImageProvider = 'pollinations' | 'openrouter' | 'runware' | 'newprovider';

// Add defaults if needed
export const DEFAULT_NEW_PROVIDER: ImageProvider = 'newprovider';
```

### 2. Update Selector Component

```typescript
// src/components/selectors/ImageProviderSelector.tsx

const PROVIDER_OPTIONS = [
  { value: 'pollinations', label: 'Pollinations' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'runware', label: 'Runware' },
  { value: 'newprovider', label: 'New Provider' },  // Add here
];
```

### 3. Handle Provider-Specific Logic

```typescript
// In the selector or API call
if (provider === 'newprovider') {
  // Handle specific model fetching or options
}
```

---

## 🧩 Adding a New UI Component

### 1. Create Component File

```typescript
// src/components/ui/NewComponent.tsx
import React from 'react';

interface NewComponentProps {
  // Define props
}

const NewComponent: React.FC<NewComponentProps> = (props) => {
  return (
    <div className="new-component">
      {/* Component content */}
    </div>
  );
};

export default NewComponent;
```

### 2. Add CSS Classes (if needed)

```css
/* src/index.css */
@layer components {
  .new-component {
    @apply bg-slate-800 rounded-lg p-4;
  }
}
```

### 3. Export from Index

```typescript
// src/components/ui/index.ts
export { default as NewComponent } from './NewComponent';
```

---

## 📝 Adding a New Modal

### 1. Create Modal Component

```typescript
// src/components/modals/NewModal.tsx
import React, { useState } from 'react';
import { Button, Input } from '../ui';
import Modal from './Modal';

interface NewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const NewModal: React.FC<NewModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit({ value });
      onClose();
    } catch (error) {
      alert('Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Modal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter value..."
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={isLoading}>
            Submit
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default NewModal;
```

### 2. Export from Index

```typescript
// src/components/modals/index.ts
export { default as NewModal } from './NewModal';
```

### 3. Use in Parent Component

```typescript
import { NewModal } from './components/modals';

const [showModal, setShowModal] = useState(false);

<Button onClick={() => setShowModal(true)}>Open Modal</Button>

<NewModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSubmit={handleSubmit}
/>
```

---

## 🔌 Adding a New API Endpoint

### 1. Add to Appropriate API Service

```typescript
// src/api/clip.ts
class ClipAPI {
  // ...existing methods...

  static async newEndpoint(param1: string, param2: number): Promise<Response> {
    const response = await axios.post(`${API_BASE_URL}/new-endpoint`, {
      param1,
      param2,
    });
    return response.data;
  }
}
```

### 2. Add to Main API Facade

```typescript
// src/api/api.ts
const API = {
  // ...existing methods...
  newEndpoint: ClipAPI.newEndpoint.bind(ClipAPI),
};
```

### 3. Add Types if Needed

```typescript
// src/api/structs/clip.ts
export interface NewResponse {
  id: string;
  status: string;
}
```

---

## 📂 Adding a New Feature Module

For larger features, create a new folder:

```
src/components/newfeature/
├── NewFeatureList.tsx      # Main container
├── NewFeatureItem.tsx      # Item component
├── NewFeatureForm.tsx      # Form component
└── index.ts                # Exports
```

### 1. Create Components

Follow the patterns in `/ideas` or `/clips`.

### 2. Create Index

```typescript
// src/components/newfeature/index.ts
export { default as NewFeatureList } from './NewFeatureList';
export { default as NewFeatureItem } from './NewFeatureItem';
export { default as NewFeatureForm } from './NewFeatureForm';
```

### 3. Import in App

```typescript
// src/App.tsx
import { NewFeatureList } from './components/newfeature';
```

---

## ✅ Checklist for New Features

- [ ] Types defined in `/api/structs`
- [ ] API methods in appropriate service
- [ ] API exported in `/api/api.ts`
- [ ] Components use UI primitives
- [ ] Components exported via `index.ts`
- [ ] CSS classes added if needed
- [ ] Props documented with TypeScript interfaces
- [ ] Error handling with try/catch
- [ ] Loading states for async operations

---

## 🧪 Testing Patterns

```typescript
// Example test structure
describe('NewComponent', () => {
  it('renders correctly', () => {
    render(<NewComponent prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles click', async () => {
    const onClick = jest.fn();
    render(<NewComponent onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```