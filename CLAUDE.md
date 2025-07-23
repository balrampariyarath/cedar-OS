# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cedar is a JavaScript library for building interactive AI applications. It consists of two main parts:
1. A Next.js web application (root level) - serves as documentation and examples
2. The Cedar library package (`packages/cedar/`) - the core UI components and state management

## Commands

### Development
- `npm run dev` - Start development server with local source (runs workspace restore first)
- `npm run dev:test` - Start development server with build preparation (for testing)
- `npm run dev:manual` - Start development server without preparation scripts
- `npm run build` - Build the Next.js application for production
- `npm start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint on the codebase
- `npm run pretty` - Format code with Prettier
- `npm test` - Run Jest tests

### Utility Scripts
- `npm run pb` - Prepare build (runs `scripts/prepare-build.mjs`)
- `npm run pm` - Prepare manual (runs `scripts/prepare-manual.mjs`)
- `npm run rw` - Restore workspace (runs `scripts/restore-workspace.mjs`)
- `npm run ust` - Update Supabase types for product roadmap example

### Agent Development (in product roadmap example)
Navigate to `src/app/examples/product-roadmap/product_roadmap-agent/`:
- `npm run dev` - Start Mastra development server
- `npm run build` - Build the agent
- `npm run start` - Start the agent in production

## Architecture

### Monorepo Structure
- **Root**: Next.js application for documentation and examples
- **`packages/cedar/`**: Core Cedar library with exportable components
- Uses npm workspaces for package management

### Cedar Library (`packages/cedar/`)
- **Components**: Modular UI components organized by function:
  - `chatInput/`: Rich chat input with mentions and context
  - `chatMessages/`: Various message rendering components
  - `containers/`: 3D and glassmorphic container components
  - `inputs/`, `ornaments/`, `text/`: Specialized UI components
- **State Management**: Zustand-based store with typed slices:
  - `agentConnection/`: Handles AI provider connections (OpenAI, Mastra, AI SDK)
  - `messages/`: Message history and rendering
  - `voice/`: Voice interaction handling
  - `stateSlice/`: General application state
- **Hooks**: Custom hooks for message rendering and state management

### Examples Structure
- **Product Roadmap** (`src/app/examples/product-roadmap/`):
  - React Flow-based interactive roadmap visualization
  - Supabase integration for data persistence
  - Dedicated Mastra agent for roadmap assistance
  - Custom FeatureNode components with inline editing

### Key Technologies
- **Frontend**: Next.js 15, React 18, TypeScript
- **UI**: TailwindCSS, Radix UI components, React Flow
- **State**: Zustand store with typed slices
- **AI Integration**: Multiple providers via AI SDK (OpenAI, Anthropic, Google, etc.)
- **Agent Framework**: Mastra for building AI agents
- **Database**: Supabase (for examples)

### Environment Variables
- `USE_LOCAL_SRC`: Controls whether to use local source or built package

### Development Workflow
1. Use `npm run dev` for standard development (automatically restores workspace)
2. The workspace contains both the main app and the Cedar library package
3. Changes to `packages/cedar/` are reflected in the main application
4. Examples demonstrate Cedar library usage patterns

### Testing
- Jest configuration for unit testing
- Tests located in `packages/cedar/__tests__/`
- Focus on component functionality and state management

### Code Conventions (from .cursor/rules/)
- Use camelCase for files and variables
- Absolute imports with `@/` prefix from src
- Early returns for readability
- TailwindCSS for all styling (no CSS files)
- Descriptive naming with "handle" prefix for event functions
- Accessibility features on interactive elements
- Use `const` over `function` declarations with TypeScript types