# Directory Structure

> How frontend code is organized in this project.

---

## Overview

The project is a compact single-page React application. `src/App.tsx` owns the top-level app flow: loading model data, synchronizing URL state, filtering/sorting/pagination, theme/language controls, and wiring feature components together. Reusable UI primitives live under `src/components/ui/`, domain feature components live directly under `src/components/`, and shared domain helpers live in `src/lib/utils.ts`, `src/constants.ts`, and `src/types.ts`.

There is no feature-folder architecture yet. Keep new files close to the existing layer they extend, and only introduce deeper feature directories when a feature grows past the current flat component layout.

---

## Directory Layout

```
src/
├── App.tsx                    # App shell, data loading, filters, URL sync, layout
├── main.tsx                   # React entrypoint and provider setup
├── index.css                  # Tailwind CSS 4 theme tokens and base layer
├── constants.ts               # API URL, UI constants, capability metadata, URL keys
├── types.ts                   # Shared API and app state TypeScript shapes
├── lib/
│   └── utils.ts               # Pure formatting, URL, flattening, icon, and cn helpers
├── i18n/
│   ├── index.ts               # i18next initialization
│   └── locales/
│       ├── en.json            # English strings
│       └── zh.json            # Chinese strings
└── components/
    ├── DetailRow.tsx          # Feature helper component
    ├── MobileFilterSheet.tsx  # Mobile filter UI
    ├── ModelCard.tsx          # Model grid card
    ├── ModelDetailSheet.tsx   # Model detail drawer
    ├── ModelLogo.tsx          # Provider/model logo fallback rendering
    ├── Pagination.tsx         # Pagination controls
    └── ui/                    # Radix/shadcn-style primitives
        ├── button.tsx
        ├── card.tsx
        ├── input.tsx
        ├── select.tsx
        ├── sheet.tsx
        └── ...
```

---

## Module Organization

Use the existing layers:

- Put app-wide orchestration in `src/App.tsx` while the app is still this small. Examples: fetching `API_URL`, computing `filteredModels`, syncing `UrlState`, opening `ModelDetailSheet`.
- Put reusable domain display pieces in `src/components/`. Examples: `ModelCard`, `ModelDetailSheet`, `MobileFilterSheet`, `Pagination`.
- Put generic UI primitives in `src/components/ui/`. These files follow the shadcn/Radix wrapper pattern and should stay domain-agnostic.
- Put pure cross-component logic in `src/lib/utils.ts`. Existing examples include `parseUrlStateFromSearch`, `buildUrlSearchFromState`, `flattenModels`, `extractProviders`, `formatCost`, and `formatTokens`.
- Put stable app constants in `src/constants.ts`. Existing examples include `CAPABILITIES`, `URL_KEYS`, `DEFAULT_URL_STATE`, and `SORT_KEYS`.
- Put shared data contracts in `src/types.ts`. Existing examples include `ApiResponse`, `Model`, `FlattenedModel`, `CapabilityKey`, and `UrlState`.
- Put translated strings in both `src/i18n/locales/en.json` and `src/i18n/locales/zh.json`. Do not add visible UI copy in components without locale keys.

Example from the current app:

```ts
// src/App.tsx
const allModels = useMemo(() => {
  if (!data) return []
  return flattenModels(data)
}, [data])
```

`App.tsx` owns the stateful orchestration, while `flattenModels` remains a pure utility in `src/lib/utils.ts`.

---

## Naming Conventions

- React feature component files use PascalCase: `ModelCard.tsx`, `ModelDetailSheet.tsx`, `MobileFilterSheet.tsx`.
- UI primitive files under `src/components/ui/` use lowercase names that match shadcn-style components: `button.tsx`, `select.tsx`, `tooltip.tsx`.
- Shared non-component modules use lowercase noun names: `types.ts`, `constants.ts`, `utils.ts`.
- Components use named exports, except `App.tsx`, which uses the default export expected by the Vite entrypoint.
- Use the `@/` alias for imports from `src/` across layers, as in `@/components/ui/button`, `@/lib/utils`, and `@/types`.
- Sibling feature components may use relative imports when the relationship is local and obvious, as in `import { ModelLogo } from './ModelLogo'`.

---

## Examples

- `src/App.tsx`: current reference for app-level state, memoized derivations, URL synchronization, keyboard shortcuts, and responsive layout wiring.
- `src/components/ModelCard.tsx`: current reference for a feature card that combines domain data, UI primitives, local copy state, tooltips, icons, and i18n.
- `src/components/ModelDetailSheet.tsx`: current reference for a feature detail drawer using Radix sheet primitives and reusable `DetailRow`.
- `src/components/ui/button.tsx`: current reference for primitive wrappers using `cva`, `VariantProps`, `React.ComponentProps`, `Slot`, and `cn`.
- `src/lib/utils.ts`: current reference for pure helper functions and type guards.

Avoid creating new root-level directories until the app has enough repeated structure to justify them.
