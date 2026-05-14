# Quality Guidelines

> Code quality standards for frontend development.

---

## Overview

Quality gates are currently linting and production build. The app has no test runner configured yet. TypeScript strictness, ESLint recommended rules, React Hooks linting, React Refresh constraints, and Vite build output are the main automated checks.

Run before reporting a frontend change complete:

```bash
pnpm lint
pnpm build
```

Formatting baseline comes from `.editorconfig`: UTF-8, LF line endings, final newline, 2-space indentation for JS/TS/JSON/YAML/CSS/Markdown, and trailing whitespace trimmed except in Markdown.

---

## Forbidden Patterns

- Do not bypass the i18n files for visible UI text. Add keys to both `src/i18n/locales/en.json` and `src/i18n/locales/zh.json`.
- Do not add global state or a server-state library for local filter/UI behavior.
- Do not keep derived collections in state when they can be computed from source state with `useMemo`.
- Do not access browser globals without `typeof window !== 'undefined'` in initialization paths.
- Do not hand-roll accessible select/dialog/tooltip primitives when Radix wrappers already exist.
- Do not introduce `any`, enums, or broad assertions for regular app code.
- Do not export non-component helpers from feature component modules. React Refresh linting expects component files to export components; the config only disables this for `src/components/ui/button.tsx` and `src/components/ui/badge.tsx`.
- Do not edit generated or build output. `dist` is globally ignored by ESLint.

---

## Required Patterns

- Use `@/` imports for cross-layer `src` imports.
- Use type-only imports for shared types.
- Keep common data contracts in `src/types.ts`.
- Keep shared constants in `src/constants.ts`.
- Keep pure transforms and formatting in `src/lib/utils.ts`.
- Use `Button`, `Select`, `Sheet`, `Tooltip`, and other local UI primitives where they fit.
- Use lucide-react icons and Tailwind `size-*` classes for icon sizing.
- Keep theme-aware styles on semantic tokens such as `bg-background`, `text-muted-foreground`, `border-border`, and `bg-primary`.
- Use `useCallback` for handlers passed to child components when they close over state or are used in effect dependencies.
- Use `useMemo` for model filtering, sorting, flattening, and derived option lists.
- Preserve mobile/desktop parity when changing filters; both `App.tsx` desktop controls and `MobileFilterSheet` may need updates.

Example review target:

```tsx
// src/App.tsx
<MobileFilterSheet
  selectedProvider={selectedProvider}
  onProviderChange={handleProviderChange}
  selectedCapabilities={selectedCapabilities}
  onCapabilityToggle={toggleCapability}
  selectedInputModality={selectedInputModality}
  selectedOutputModality={selectedOutputModality}
  onInputModalityChange={handleInputModalityChange}
  onOutputModalityChange={handleOutputModalityChange}
  resultCount={filteredModels.length}
/>
```

---

## Testing Requirements

There is no automated unit/component test setup in the current project. For now:

- Always run `pnpm lint`.
- Always run `pnpm build`, which runs `tsc -b && vite build`.
- For UI behavior changes, manually verify the affected flow in the browser when possible.
- For filter/sort/URL changes, check URL round-tripping, back/forward navigation, pagination reset, and mobile filter behavior.
- For i18n changes, verify both English and Chinese locale files include the same keys.
- If adding a test framework later, document its command here and keep tests close to the behavior they cover.

---

## Code Review Checklist

Check these before accepting frontend changes:

- Data flow: API response shape still matches `src/types.ts`, `flattenModels`, and consumers.
- URL state: `parseUrlStateFromSearch`, `buildUrlSearchFromState`, `URL_KEYS`, and `UrlState` stay aligned.
- Constants: changes to `CAPABILITIES`, `SORT_KEYS`, or `DEFAULT_URL_STATE` are reflected in UI, i18n, types, and URL parsing.
- Derived state: filters, provider/modality options, selected model, and pagination remain derived instead of duplicated.
- Accessibility: custom buttons have `type="button"` when appropriate, toggle chips expose `aria-pressed`, icon-only controls have tooltip/label text, and Radix primitives keep their semantic wrappers.
- Responsive behavior: desktop controls and `MobileFilterSheet` expose the same filter/sort capabilities.
- Theme behavior: styles use semantic tokens and still work in `.dark`.
- Localization: visible copy uses `t(...)`, and both locale JSON files are updated.
- Build health: `pnpm lint` and `pnpm build` pass.
