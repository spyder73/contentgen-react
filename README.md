# ContentGen React Frontend

A modern React frontend for AI-powered content generation, built with TypeScript, Tailwind CSS, and a modular component architecture.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
src/
├── api/                    # API layer
│   ├── structs/           # TypeScript interfaces & types
│   └── *.ts               # API service classes
├── components/            # React components
│   ├── clips/             # Clip-related components
│   ├── ideas/             # Idea-related components
│   ├── layout/            # Layout components (Header, Toast)
│   ├── modals/            # Modal dialogs
│   ├── selectors/         # Provider/Model selectors
│   ├── ui/                # Reusable UI primitives
│   └── user/              # User management components
├── index.css              # Tailwind + custom CSS classes
├── App.tsx                # Main application component
└── main.tsx               # Application entry point
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [API Layer](./docs/API.md) | API services, types, and data structures |
| [Components](./docs/COMPONENTS.md) | Component documentation and usage |
| [UI System](./docs/UI.md) | UI primitives and CSS classes |
| [Extending](./docs/EXTENDING.md) | How to add new features |

## 🏗️ Architecture Overview

### Core Concepts

1. **Providers** - External API services (OpenRouter, Pollinations, Runware)
2. **Models** - AI models available through providers
3. **Ideas** - User-generated content ideas
4. **Clips** - Video clips with images, text, and metadata

### Data Flow

```
User Input → Ideas → Clip Prompts → Images/Videos → Final Clip
                ↓
         AI Generation
      (Chat/Image/Video)
```

### State Management

- React `useState` for local component state
- Props drilling for shared state
- WebSocket for real-time updates

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Tailwind Configuration

Tailwind is configured in `tailwind.config.js` with:
- Dark theme (slate color palette)
- Custom component classes in `index.css`

## 🎨 Design System

- **Colors**: Slate-based dark theme with accent colors
- **Typography**: System fonts with consistent sizing
- **Spacing**: Tailwind's default spacing scale
- **Components**: Consistent rounded corners, shadows, and hover states

See [UI Documentation](./docs/UI.md) for details.

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Axios | HTTP requests |
| Vite | Build tool |

## 🤝 Contributing

1. Follow the component structure in `/components`
2. Use TypeScript interfaces for all props
3. Use UI primitives from `/components/ui`
4. Add CSS classes to `index.css` when needed
5. Document new components

## 📄 License

MIT
