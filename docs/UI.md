# UI System Documentation

The UI system provides reusable primitives and CSS classes for consistent styling.

## 📁 Structure

```
src/
├── components/ui/          # React UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── TextArea.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Dropdown.tsx
│   └── index.ts
└── index.css               # Tailwind + custom classes
```

---

## 🧩 UI Components

### Button

```tsx
import { Button } from './components/ui';

<Button variant="primary" size="md" loading={false}>
  Click me
</Button>

<Button variant="danger" size="sm">Delete</Button>

<Button icon onClick={handleClick}>🔄</Button>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'purple' \| 'ghost'` | `'primary'` | Button style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `icon` | `boolean` | `false` | Icon-only button |
| `loading` | `boolean` | `false` | Show loading state |
| `disabled` | `boolean` | `false` | Disable button |

### Input

```tsx
import { Input } from './components/ui';

<Input
  placeholder="Enter text..."
  inputSize="md"
  error="This field is required"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `inputSize` | `'sm' \| 'md'` | `'md'` | Input size |
| `error` | `string` | - | Error message |

### TextArea

```tsx
import { TextArea } from './components/ui';

<TextArea
  rows={4}
  placeholder="Enter description..."
  error="Required"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | `number` | `3` | Number of rows |
| `error` | `string` | - | Error message |

### Select

```tsx
import { Select } from './components/ui';

<Select
  options={[
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ]}
  value={selected}
  onChange={(e) => setSelected(e.target.value)}
  selectSize="sm"
  placeholder="Choose..."
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `{ value: string, label: string }[]` | - | Options list |
| `selectSize` | `'sm' \| 'md'` | `'md'` | Select size |
| `placeholder` | `string` | - | Placeholder option |

### Dropdown

Searchable dropdown with custom options.

```tsx
import { Dropdown } from './components/ui';

<Dropdown
  options={[
    { value: 'model-1', label: 'Model 1', sublabel: 'Fast', rightLabel: 'Free' },
    { value: 'model-2', label: 'Model 2', sublabel: 'Quality', rightLabel: '$0.01' },
  ]}
  value={selected}
  onChange={setSelected}
  placeholder="Select model"
  searchable
  loading={false}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `DropdownOption[]` | - | Options with label, sublabel, rightLabel |
| `value` | `string` | - | Selected value |
| `onChange` | `(value: string) => void` | - | Change handler |
| `searchable` | `boolean` | `false` | Enable search |
| `loading` | `boolean` | `false` | Loading state |

### Card

```tsx
import { Card } from './components/ui';

<Card hover onClick={handleClick}>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content here</Card.Body>
</Card>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `hover` | `boolean` | `false` | Hover effect |
| `onClick` | `() => void` | - | Click handler |

### Badge

```tsx
import { Badge } from './components/ui';

<Badge variant="green">Active</Badge>
<Badge variant="yellow">Pending</Badge>
<Badge variant="red">Error</Badge>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'blue' \| 'green' \| 'yellow' \| 'red' \| 'purple'` | `'blue'` | Badge color |

---

## 🎨 CSS Classes

Custom Tailwind `@apply` classes in `index.css`.

### Buttons

| Class | Description |
|-------|-------------|
| `.btn` | Base button styles |
| `.btn-primary` | Blue primary button |
| `.btn-secondary` | Gray secondary button |
| `.btn-success` | Green success button |
| `.btn-danger` | Red danger button |
| `.btn-purple` | Purple button |
| `.btn-ghost` | Transparent ghost button |
| `.btn-sm` | Small button size |
| `.btn-icon` | Icon-only button |

### Inputs

| Class | Description |
|-------|-------------|
| `.input` | Text input styling |
| `.input-sm` | Small input |
| `.select` | Select dropdown styling |
| `.select-sm` | Small select |
| `.textarea` | Textarea styling |

### Cards

| Class | Description |
|-------|-------------|
| `.card` | Card container |
| `.card-hover` | Card with hover effect |
| `.card-header` | Card header section |
| `.card-body` | Card body section |

### Dropdowns

| Class | Description |
|-------|-------------|
| `.dropdown` | Dropdown container |
| `.dropdown-item` | Dropdown option |
| `.dropdown-item-active` | Selected option |

### Badges

| Class | Description |
|-------|-------------|
| `.badge` | Base badge |
| `.badge-blue` | Blue badge |
| `.badge-green` | Green badge |
| `.badge-yellow` | Yellow badge |
| `.badge-red` | Red badge |
| `.badge-purple` | Purple badge |

### Modals

| Class | Description |
|-------|-------------|
| `.modal-overlay` | Modal backdrop |
| `.modal-content` | Modal container |
| `.modal-header` | Modal header |
| `.modal-title` | Modal title text |
| `.modal-body` | Modal content area |
| `.modal-footer` | Modal footer |

### Layout

| Class | Description |
|-------|-------------|
| `.page-header` | App header |
| `.page-container` | Max-width container |
| `.section-title` | Section heading |
| `.section-subtitle` | Section subheading |

### Lists

| Class | Description |
|-------|-------------|
| `.list-container` | Scrollable list |
| `.list-item` | List item card |
| `.list-empty` | Empty state |

### Utilities

| Class | Description |
|-------|-------------|
| `.text-muted` | Gray muted text |
| `.text-success` | Green success text |
| `.text-danger` | Red error text |
| `.text-warning` | Yellow warning text |
| `.truncate-2` | 2-line truncation |
| `.truncate-3` | 3-line truncation |

### Animations

| Class | Description |
|-------|-------------|
| `.animate-fade-in` | Fade in animation |
| `.animate-slide-up` | Slide up animation |

---

## 🎨 Color Palette

| Color | Usage | Tailwind Class |
|-------|-------|----------------|
| Slate 900 | Background | `bg-slate-900` |
| Slate 800 | Cards | `bg-slate-800` |
| Slate 700 | Inputs/Borders | `bg-slate-700`, `border-slate-700` |
| Slate 600 | Hover states | `hover:bg-slate-600` |
| Slate 400 | Muted text | `text-slate-400` |
| Blue 600 | Primary actions | `bg-blue-600` |
| Green 600 | Success actions | `bg-green-600` |
| Red 600 | Danger actions | `bg-red-600` |
| Purple 600 | Special actions | `bg-purple-600` |