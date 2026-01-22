# ContentGen

ContentGen React Frontend - The FrontEnd of my (Private) Content Generator Project

## Overview

ContentGen is a modular system for generating AI-powered video content. Users create ideas, generate images and videos through various AI providers, and assemble them into clips with custom pipelines.

## Tech Stack

**Frontend:** React 18, TypeScript, Tailwind CSS, Vite  
**Backend:** Go, Echo  
**AI Providers:** OpenRouter, Runware, Pollinations, Suno, Udio

## Features

- **Multi-Provider Architecture** — Unified interface for multiple AI providers (image, video, audio, chat)
- **Pipeline System** — Customizable checkpoint-based workflows for content generation
- **Real-time Updates** — WebSocket integration for live generation progress
- **Extensible Design** — Easy to add new providers and generation types

## Project Structure

```
src/
├── api/                    # API layer & TypeScript interfaces
├── components/
│   ├── clips/              # Clip management & media editing
│   ├── pipeline/           # Pipeline builder & checkpoint flow
│   ├── selectors/          # Provider & model selection
│   └── ui/                 # Reusable UI primitives
└── App.tsx
```

## Pipelines

Pipelines define multi-step content generation workflows. Each pipeline contains:

- **Checkpoints** — Individual processing steps (e.g., generate prompt, create image, refine)
- **Prompt Templates** — Reusable templates with variable interpolation
- **Provider Overrides** — Per-checkpoint model and provider configuration

The visual pipeline editor allows drag-and-drop reordering and real-time preview of the generation flow.

## Quick Start

```bash
npm install
npm run dev
```

## License

MIT
