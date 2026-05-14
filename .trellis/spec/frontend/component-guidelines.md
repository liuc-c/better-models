# Component Guidelines

> How components are built in this project.

---

## Overview

Components are plain function components written in TypeScript. Feature components are small named exports in `src/components/`; generic primitives are shadcn/Radix-style wrappers in `src/components/ui/`. Styling is primarily Tailwind utility classes using theme tokens from `src/index.css`.

Current examples:

- `src/components/ModelCard.tsx` renders a clickable model summary card with local copy state.
- `src/components/ModelDetailSheet.tsx` renders the detail drawer for a selected model.
- `src/components/MobileFilterSheet.tsx` renders the bottom-sheet filter UI for small screens.
- `src/components/ui/button.tsx`, `src/components/ui/select.tsx`, and `src/components/ui/sheet.tsx` wrap Radix and local variant styling.

---

## Component Structure

Feature components generally follow this order:

1. React/library imports.
2. UI primitive imports.
3. type-only imports from `@/types`.
4. constants and utilities.
5. local sibling component imports.
6. local module constants.
7. exported function component.
8. local handlers before JSX return.

Example:

```tsx
// src/components/ModelCard.tsx
const MODEL_METADATA_KEYS = new Set([
  'providerId',
  'providerName',
  'providerNpm',
  'providerApi',
  'providerDoc',
  'providerEnv',
])

export function ModelCard({
  model,
  onCopy,
  onViewDetails,
}: {
  model: FlattenedModel
  onCopy: (model: FlattenedModel) => void
  onViewDetails: (model: FlattenedModel) => void
}) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  // handlers, then JSX
}
```

`App.tsx` is the exception: it is the application shell and can contain orchestration that would be premature to split out while the app is small.

---

## Props Conventions

- Type props inline in the function signature for small components. This is the current pattern in `DetailRow`, `ModelLogo`, `Pagination`, `ModelCard`, and `ModelDetailSheet`.
- Use domain types from `src/types.ts` for model data. Example: `model: FlattenedModel`.
- Callback props are explicit function types. Examples: `onViewDetails: (model: FlattenedModel) => void`, `onOpenChange: (open: boolean) => void`.
- Keep optional props minimal and give defaults in destructuring. Example: `mono = false` in `DetailRow`, `className = ''` in `ModelLogo`.
- UI primitives use `React.ComponentProps<...>` and `VariantProps` instead of hand-written prop mirrors.

Example:

```tsx
// src/components/Pagination.tsx
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  // ...
}
```

Do not use `React.FC`; the current codebase uses direct function declarations.

---

## Styling Patterns

Use Tailwind CSS utilities directly in `className`. Prefer semantic tokens from `src/index.css` over raw color choices: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`, `bg-muted`, `text-destructive`.

Feature components commonly use template literals for selected/unselected states:

```tsx
// src/components/MobileFilterSheet.tsx
className={`
  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
  ${isSelected
    ? 'bg-primary text-primary-foreground border-primary'
    : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
  }
`}
```

UI primitives use the local `cn` helper, and variant-heavy primitives use `class-variance-authority`:

```tsx
// src/components/ui/button.tsx
className={cn(buttonVariants({ variant, size, className }))}
```

Icons come from `lucide-react`; size them with Tailwind `size-*` utilities. Use `getModalityIcon` from `src/lib/utils.ts` when rendering modality icons so the mapping stays centralized.

---

## Accessibility

Follow the accessibility patterns already present:

- Use real `button` elements for clickable custom controls and set `type="button"` when inside UI surfaces.
- Use `aria-pressed` for toggle chips, as in capability buttons in `MobileFilterSheet` and `App.tsx`.
- Wrap icon-only actions with `Tooltip`, `TooltipTrigger asChild`, and `TooltipContent`, as in `ModelCard`.
- Preserve Radix semantics for `Select`, `Sheet`, and `Tooltip`; do not replace them with ad hoc div-based controls.
- Use `SheetTitle` and `SheetDescription` inside sheet headers.
- Keep the sheet close label available to screen readers with `sr-only`, as in `src/components/ui/sheet.tsx`.
- Stop event propagation for nested card actions that should not trigger the parent card click, as in `handleCopy`, `handleNpmCopy`, and `handleIdCopy` in `ModelCard`.

Example:

```tsx
// src/components/ModelCard.tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon" className="size-8" onClick={handleCopy}>
      {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
    </Button>
  </TooltipTrigger>
  <TooltipContent>{t('card.copyModelJson')}</TooltipContent>
</Tooltip>
```

---

## Common Mistakes

- Do not hard-code visible UI strings in components. Add keys to both locale JSON files and call `t(...)`.
- Do not introduce a new component primitive if an existing `src/components/ui/` wrapper fits.
- Do not use raw brand colors for standard UI states when theme tokens exist.
- Do not forget `e.stopPropagation()` for actions inside clickable cards.
- Do not export unrelated helper values from feature component files unless there is a React Refresh reason and the lint rule allows it. The ESLint config only relaxes `react-refresh/only-export-components` for specific UI primitive files.
- Do not duplicate the `MODEL_METADATA_KEYS` filtering behavior differently in card/detail copy flows without first extracting or intentionally reconciling it.
