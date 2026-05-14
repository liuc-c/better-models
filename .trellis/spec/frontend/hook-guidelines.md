# Hook Guidelines

> How hooks are used in this project.

---

## Overview

The project currently has no custom hook files. React hooks are used directly inside `App.tsx` and feature components. Keep logic inline when it is only used once; extract a custom hook only when the same stateful/browser behavior is reused or when extraction makes a large component materially easier to read.

Existing hook usage:

- `src/App.tsx`: `useState`, `useEffect`, `useMemo`, `useCallback`, and `useRef` for app state, derived data, URL sync, keyboard shortcuts, and input focus.
- `src/components/ModelCard.tsx`: local copy-button state and memoized handlers.
- `src/components/ModelDetailSheet.tsx`: local copy state and guarded handler for nullable `model`.
- `src/components/ModelLogo.tsx`: local image fallback error state.

---

## Custom Hook Patterns

If a custom hook becomes necessary:

- Name it with the `use*` prefix.
- Keep it close to its feature first unless it is broadly reusable.
- Return a typed object when there are several values/handlers; a tuple is acceptable only for a very small state pair.
- Keep browser API access guarded with `typeof window !== 'undefined'`.
- Do not hide global mutable state inside a hook; the current app state model is explicit React state passed through props.
- Keep pure transformations in `src/lib/utils.ts` instead of a hook.

Before extracting, check whether the code is actually reused. For example, `formatCost`, `formatTokens`, `parseUrlStateFromSearch`, and `buildUrlSearchFromState` are pure utilities, not hooks.

---

## Data Fetching

The app fetches model data directly in `App.tsx`; there is no React Query, SWR, Redux, Zustand, or other data-fetching/state library.

Current pattern:

```tsx
// src/App.tsx
useEffect(() => {
  if (data) return

  fetch(API_URL)
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch data')
      return res.json()
    })
    .then((json) => {
      try {
        sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(json))
      } catch {
        // Ignore quota errors
      }
      setData(json)
      setLoading(false)
    })
    .catch((err) => {
      setError(err.message)
      setLoading(false)
    })
}, [data])
```

Keep server-data behavior in one place unless the app gains multiple independent server data domains. Cache the API response in `sessionStorage`, and keep parse/cache failures non-fatal.

---

## Naming Conventions

- React hook imports come from `react` at the top of the component file.
- Lazy initializers are used for browser-backed initial state, as in `useState(() => initialUrlState.search)` and `useState(() => initialCachedData === null)`.
- Memoized derived values use names that describe the result, not the implementation: `providers`, `allModels`, `filteredModels`, `paginatedModels`, `selectedModel`, `effectiveSelectedProvider`.
- Event handlers are named `handle*`, and toggles are named `toggle*`: `handleProviderChange`, `handlePageChange`, `handleSheetOpenChange`, `toggleCapability`, `toggleTheme`.
- Refs include the `Ref` suffix: `searchInputRef`, `skipNextUrlWriteRef`, `lastUrlStateRef`.

Example:

```tsx
// src/App.tsx
const handleInputModalityChange = useCallback((modality: string) => {
  setCurrentPage(1)
  setSelectedInputModality((prev) =>
    prev.includes(modality)
      ? prev.filter((m) => m !== modality)
      : [...prev, modality]
  )
}, [])
```

---

## Common Mistakes

- Do not store values in state when they can be derived with `useMemo`. Current examples: `providers`, `allModels`, `filteredModels`, modalities, and pagination slices.
- Do not access `window`, `localStorage`, or `sessionStorage` without a browser guard when code can run during initialization.
- Do not omit effect dependencies. The project uses `eslint-plugin-react-hooks` recommended rules.
- Do not update the URL directly inside every event handler. The current pattern centralizes URL writing in one effect based on `UrlState`.
- Do not let `popstate` immediately write back to history. `skipNextUrlWriteRef` exists to prevent that feedback loop.
- Do not handle global keyboard shortcuts while focus is inside text-editable targets. Use `shouldIgnoreKeydownTarget`.
