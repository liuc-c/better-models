# Type Safety

> Type safety patterns in this project.

---

## Overview

The project uses TypeScript in strict mode. Shared API and app-state contracts live in `src/types.ts`, constants use `as const` where literal types matter, and imports use `import type` for type-only dependencies. Runtime validation is limited: URL params and browser cache parsing are guarded, while the `models.dev` API response is treated as trusted and handled defensively with optional fields.

Important compiler settings from `tsconfig.app.json`:

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `erasableSyntaxOnly: true`
- `noFallthroughCasesInSwitch: true`
- `noUncheckedSideEffectImports: true`
- path alias `@/* -> ./src/*`

---

## Type Organization

Put shared domain and app-state types in `src/types.ts`:

```ts
// src/types.ts
export interface FlattenedModel extends Model {
  providerId: string
  providerName: string
  providerNpm?: string
  providerApi?: string
  providerDoc?: string
  providerEnv?: string[]
}

export type CapabilityKey = 'reasoning' | 'tool_call' | 'structured_output' | 'attachment' | 'open_weights'

export interface UrlState {
  search: string
  provider: string
  caps: CapabilityKey[]
  inputModality: string[]
  outputModality: string[]
  sortBy: string
  page: number
  modelId: string | null
}
```

Use inline prop types for small components and shared types for domain payloads:

```tsx
// src/components/ModelDetailSheet.tsx
export function ModelDetailSheet({
  model,
  open,
  onOpenChange,
}: {
  model: FlattenedModel | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  // ...
}
```

UI primitive wrappers use React's built-in component prop helpers:

```tsx
// src/components/ui/input.tsx
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    // ...
  }
)
```

---

## Validation

There is no Zod/Yup/io-ts validation layer. Keep validation focused at real boundaries:

- URL params are parsed and sanitized in `parseUrlStateFromSearch`.
- Page params are constrained by `parsePageNumber`.
- Capability params are filtered through a `CapabilityKey` type guard.
- Browser cache JSON parse errors are caught in `readSessionCache`.
- Optional API fields are rendered with optional chaining and fallback values.

Example:

```ts
// src/lib/utils.ts
const capabilityKeySet = new Set<CapabilityKey>(CAPABILITIES.map((c) => c.key))
const capsFromUrl = Array.from(new Set([...capsFromCsv, ...capsFromRepeated]))
  .filter((key): key is CapabilityKey => capabilityKeySet.has(key as CapabilityKey))
```

Do not add a large validation dependency unless the app starts accepting untrusted user-authored model data or multiple API providers with inconsistent contracts.

---

## Common Patterns

Current type patterns:

- Use `import type` for type-only imports:

```ts
import type { ApiResponse, FlattenedModel, CapabilityKey, UrlState } from '@/types'
```

- Use `as const` for constant objects/arrays that should preserve literal values:

```ts
// src/constants.ts
export const URL_KEYS = {
  search: 'q',
  provider: 'provider',
  caps: 'caps',
  cap: 'cap',
  inputModality: 'in',
  outputModality: 'out',
  sort: 'sort',
  page: 'page',
  model: 'model',
} as const
```

- Use nullable state explicitly when a value can be absent:

```tsx
const [selectedModelId, setSelectedModelId] = useState<string | null>(() => initialUrlState.modelId)
```

- Use optional chaining and nullish coalescing for optional API fields:

```tsx
formatTokens(model.limit?.context ?? 0)
model.provider?.npm ?? provider.npm
```

- Use `Set` membership for constrained string values, as with `SORT_KEYS`.
- Prefer unions and const objects over TypeScript enums because `erasableSyntaxOnly` is enabled.

---

## Forbidden Patterns

- Do not use `any` for model data, component props, URL state, or utility inputs.
- Do not use broad type assertions to silence errors. The existing `JSON.parse(cached) as ApiResponse` is a boundary cast paired with a parse guard; do not spread this pattern into normal app code.
- Do not add TypeScript enums or namespaces; use literal unions and `as const` data instead.
- Do not duplicate string unions by hand in several files. Update `src/types.ts` and related constants together.
- Do not ignore optional fields from the API. Use optional chaining, null checks, or defaults in render paths.
- Do not pass raw untyped URL params into state without sanitizing them through `src/lib/utils.ts`.
