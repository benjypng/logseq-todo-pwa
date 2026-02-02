# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
bun run dev              # Start dev server
bun run dev -- --host    # Expose to local network/VPN
bun run build            # Production build
bun run lint:precommit   # Run biome check, tsc, and build (also runs on pre-commit)
```

## Architecture Overview

This is a React PWA that connects to Logseq's HTTP API for task management. The app uses a three-tier architecture:

**UI Layer → Data Layer → API Layer**

- **Components** (`src/components/`): React components using Mantine UI
- **Hooks** (`src/hooks/`): TanStack React Query for state management and API calls
- **API** (`src/api.ts`): Wretch HTTP client communicating with Logseq via JSON-RPC

### Key Data Flow

1. Vite proxies `/logseq-api` to `http://127.0.0.1:12315` (Logseq's HTTP API)
2. React Query polls every 2 seconds with aggressive refetch on focus/reconnect
3. Datascript queries in `src/constants.ts` define what data to fetch from Logseq

### Core Files

- `src/constants.ts` - Datascript queries (`GET_TASKS_FROM_LOGSEQ`, `GET_ERRANDS_FROM_LOGSEQ`), priority weights
- `src/hooks/use-tasks.ts` - Main data hooks: `useTodos`, `useAddTodo`, `useDoneTodo`, `useDoingTodo`
- `src/types.ts` - TypeScript interfaces for `LogseqTask`, `TaskStatus`, `Priority`, `TaskType`
- `src/App.tsx` - Main app with tab layout (Tasks, Errands, Expenses)

### Task Status Flow

Todo → Doing → Done (Waiting is filtered out)

### Keyboard Shortcuts (in Focus Mode)

- `a` - Add task modal
- `d` - Mark task as done
- `Escape` - Close focus mode

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Mantine** for UI components
- **TanStack React Query** for server state
- **Wretch** for HTTP requests
- **Biome** for linting/formatting (replaces ESLint + Prettier)

## Environment Variables

```
VITE_LOGSEQ_API_TOKEN=your_secret_token_here
VITE_LOGSEQ_API_URL=http://127.0.0.1:12315
```
