# Frontend Development Guidelines

> Project-specific frontend conventions for Better Models.

---

## Overview

This Vite application is a React 19 + TypeScript + Tailwind CSS 4 frontend for browsing data from `models.dev`. The app uses Radix UI primitives, lucide-react icons, i18next for English/Chinese localization, and a small set of local utilities instead of a global state or data-fetching framework.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | Filled |
| [Component Guidelines](./component-guidelines.md) | Component patterns, props, composition | Filled |
| [Hook Guidelines](./hook-guidelines.md) | Custom hooks, data fetching patterns | Filled |
| [State Management](./state-management.md) | Local state, global state, server state | Filled |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | Filled |
| [Type Safety](./type-safety.md) | Type patterns, validation | Filled |

---

## Pre-Development Checklist

Before changing frontend code:

1. Read the guide matching the layer being changed.
2. For UI work, read [Component Guidelines](./component-guidelines.md), [State Management](./state-management.md), and [Quality Guidelines](./quality-guidelines.md).
3. For model/API shape changes, read [Type Safety](./type-safety.md), [State Management](./state-management.md), and [Directory Structure](./directory-structure.md).
4. For reusable logic or browser effects, read [Hook Guidelines](./hook-guidelines.md) and [Quality Guidelines](./quality-guidelines.md).
5. Run `pnpm lint` and `pnpm build` before reporting completion.

These guidelines document current codebase reality. Do not use them as permission to introduce new architectural layers without a real need.

---

**Language**: All documentation should be written in **English**.
