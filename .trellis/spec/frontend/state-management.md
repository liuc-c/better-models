# State Management

> How state is managed in this project.

---

## Overview

State is managed with React built-in hooks. There is no global store and no server-state library. `App.tsx` owns the shared application state and passes data/handlers to child components. Child components keep only short-lived UI-local state, such as copy feedback and image-load fallback state.

The main state categories are:

- Server data from `models.dev`, stored as `ApiResponse | null` in `App.tsx`.
- URL-backed filter/detail state, represented by `UrlState` and synchronized through `parseUrlStateFromSearch` / `buildUrlSearchFromState`.
- Browser preference state for theme and language, persisted to `localStorage`.
- UI-local state for sheets, copy buttons, and image fallback rendering.
- Derived state computed with `useMemo`.

---

## State Categories

### App-owned state

`App.tsx` owns data, loading, error, filters, sort, page, selected model, and sheet visibility:

```tsx
// src/App.tsx
const [data, setData] = useState<ApiResponse | null>(initialCachedData)
const [search, setSearch] = useState(() => initialUrlState.search)
const [selectedCapabilities, setSelectedCapabilities] = useState<CapabilityKey[]>(() => initialUrlState.caps)
const [selectedModelIdentity, setSelectedModelIdentity] = useState<SelectedModelIdentity | null>(
  () => selectedModelIdentityFromUrlState(initialUrlState),
)
const [sheetOpen, setSheetOpen] = useState(() => initialUrlState.modelId !== null)
```

### Component-local state

Use local state when it only affects one component instance:

```tsx
// src/components/ModelCard.tsx
const [copied, setCopied] = useState(false)
const [npmCopied, setNpmCopied] = useState(false)
const [idCopied, setIdCopied] = useState(false)
```

```tsx
// src/components/ModelLogo.tsx
const [error, setError] = useState(false)
```

### Derived state

Use `useMemo` for derived collections and expensive filters/sorts. Do not duplicate these values in state:

```tsx
// src/App.tsx
const selectedModel = useMemo(() => {
  if (!selectedModelIdentity) return null
  return allModels.find(
    (m) => m.id === selectedModelIdentity.modelId && m.providerId === selectedModelIdentity.providerId,
  ) || null
}, [allModels, selectedModelIdentity])
```

### URL state

Filter state, page, sort, and selected model can be restored from the URL. Use the `UrlState` helpers instead of manually reading/writing query params in components.

Selected model identity must include both `modelId` and `modelProviderId`. `models.dev` model ids are reused across providers, so detail sheets, deep links, and back/forward navigation must resolve the selected model by `(providerId, modelId)`. Legacy URLs with only `model` may fall back to the active provider filter first, then the first matching model id, but new URLs should write both values.

Provider and family filters both use URL state. Family options are derived from flattened `model.family` values, sorted with icon-matched families first, and invalid URL values should be normalized through an `effectiveSelectedFamily` derived value rather than mutating state during render.

---

## When to Use Global State

Do not add a global state library for the current app shape. Existing shared state has a single owner in `App.tsx` and is passed to children through props:

- `ModelCard` receives `model`, `onCopy`, and `onViewDetails`.
- `ModelDetailSheet` receives `model`, `open`, and `onOpenChange`.
- `MobileFilterSheet` receives current filter values, available options, and callback props.
- `Pagination` receives `currentPage`, `totalPages`, and `onPageChange`.

Consider a broader state abstraction only if the same writable state must be used by multiple distant branches and prop wiring becomes a real maintenance problem.

---

## Server State

The server data source is `API_URL` from `src/constants.ts`, currently `https://models.dev/api.json`.

Current behavior:

- `readSessionCache` reads `SESSION_CACHE_KEY` from `sessionStorage`.
- Invalid cached JSON is removed and treated as a cache miss.
- `App.tsx` fetches only when `data` is absent.
- Successful responses are written back to `sessionStorage`.
- Loading and error state stay local to `App.tsx`.
- The API response is flattened with `flattenModels(data)` before rendering.

Example:

```ts
// src/lib/utils.ts
export function flattenModels(data: ApiResponse): FlattenedModel[] {
  const models: FlattenedModel[] = []

  for (const [providerId, provider] of Object.entries(data)) {
    if (!provider.models) continue

    for (const model of Object.values(provider.models)) {
      models.push({
        ...model,
        providerId,
        providerName: provider.name,
        providerNpm: model.provider?.npm ?? provider.npm,
        providerApi: model.provider?.api ?? provider.api,
        providerDoc: provider.doc,
        providerEnv: provider.env,
      })
    }
  }

  return models.sort((a, b) => {
    const dateA = a.last_updated || ''
    const dateB = b.last_updated || ''
    return dateB.localeCompare(dateA)
  })
}
```

---

## Common Mistakes

- Do not keep filtered/sorted/paginated model arrays in state; derive them from `data` and filter state.
- Do not let selected filter values point at unavailable provider/family/modality options. The app uses `effectiveSelectedProvider`, `effectiveSelectedFamily`, `effectiveSelectedInputModality`, and `effectiveSelectedOutputModality`.
- Do not forget to reset `currentPage` when filters or sort order change.
- Do not write URL params in several handlers. Keep URL serialization centralized through `UrlState`.
- Do not use `model.id` alone as selected-model state. Use provider id plus model id so duplicate ids across providers do not open mismatched detail sheets.
- Do not use `currentPage` directly for rendering when it may exceed `totalPages`; use the clamped `activePage`.
- Do not promote copy button feedback, image load failures, or mobile sheet open state into app/global state unless another component truly depends on it.
