# Display complete models.dev metadata - Design

## Architecture And Boundaries

This is a frontend-only task. It should preserve the current app architecture:

- `src/App.tsx` remains the app shell and owns data loading, derived model collections, URL state, and header layout.
- `src/components/ModelLogo.tsx` owns provider logo source fallback behavior and model-family icon rendering.
- `src/components/ModelCard.tsx` remains the compact summary surface.
- `src/components/ModelDetailSheet.tsx` becomes the complete readable metadata surface.
- `src/components/ProviderCombobox.tsx` owns searchable provider and family selection for desktop and mobile filters.
- `src/types.ts` owns the expanded `models.dev` data contracts.
- `src/lib/utils.ts` owns formatting, provider logo URL helpers, raw JSON shaping, and pure metadata helpers.
- `src/constants.ts` owns stable URLs and provider/logo mapping constants.
- `src/i18n/locales/*.json` owns all visible copy.

No global state, routing library, data-fetching library, or validation dependency is needed.

## Data Contracts

Expand the existing API types to cover observed fields without using `any`.

Provider fields:

- `id`
- `name`
- `env`
- `npm`
- `api`
- `doc`
- `models`

Model fields:

- current top-level model fields already known in `src/types.ts`
- `experimental?: { modes?: Record<string, ExperimentalMode> }`
- provider override fields: `npm`, `api`, `shape`

Cost fields:

- existing base/cache/audio/reasoning/context-over-200k fields
- `tiers?: ModelCostTier[]`

Use recursive/nested interfaces where the schema is known enough, and render unknown nested values through a typed JSON display helper using `unknown` rather than `any`.

## Data Flow

1. `App.tsx` fetches the same `API_URL`.
2. `flattenModels(data)` carries through model fields and appends provider metadata.
3. `ModelCard` renders summary fields and corrected cost labels.
4. Card-to-detail selection stores the provider id and model id together because model ids are not globally unique across providers.
5. Family filtering derives available options from flattened models and stores the selected family in URL state.
6. `ModelDetailSheet` renders complete detail sections from the flattened model.
7. Raw JSON rendering uses a utility that includes:
   - the model payload,
   - provider metadata added by flattening,
   - model-level provider override when present.
8. Future or uncommon API fields that are not explicitly rendered as structured rows remain available in the complete raw JSON output.

## Logo Fallback

Add Lobe icon support without introducing runtime probing in render loops:

1. Map known `models.dev` provider ids to Lobe icon slugs.
2. `getLobeIconUrl(providerId)` returns a static SVG CDN URL when mapped.
3. `ModelLogo` and `ProviderLogo` build a small source list:
   - colored Lobe SVG URL if mapped and color is available,
   - monochrome Lobe SVG URL if mapped,
   - `models.dev/logos/{provider}.svg`,
   - letter fallback.
4. On image error, advance to the next source.

Use Lobe CDN URLs instead of adding the full React icon package unless bundle or CORS behavior requires a package later. This keeps the implementation small and keeps unmatched providers covered by models.dev. Colored Lobe assets must not use the dark-mode invert class, because that would distort brand colors.

## Model Family Icons

Model-family icons are intentionally separate from provider logos:

1. Match `model.family` against a conservative Lobe model icon slug table.
2. Fall back to clear model id/name terms only when `family` is absent or unmapped.
3. Prefer colored Lobe SVGs, then monochrome Lobe SVGs.
4. Render nothing when there is no conservative model icon match.

Do not derive model icons from `providerId`. Provider logos remain the large logo in cards/details; model-family icons are small inline marks before model names and family option labels only.

## Pricing Semantics

Change `formatCost` to accept `number | null | undefined`:

- `undefined` / `null` -> localized unknown label where visible text is needed.
- `0` -> localized free label.
- positive values -> existing USD formatting.

Because `formatCost` currently lives in `utils.ts`, it cannot call `t`. Use one of these approaches:

- `formatCostValue(cost)` returns a structured kind/value object and components localize labels.
- Or `formatCost(cost, labels)` receives `{ free, unknown }`.

Prefer the labels parameter for minimal code movement.

Sorting behavior:

- ascending cost sorts unknown as `Infinity`;
- descending cost sorts unknown below known numeric values by treating missing as `-Infinity` or by explicit known/missing branches.

## Detail Sheet Structure

Keep the detail drawer readable by grouping fields:

- Basic Info
- Dates
- Capabilities
- Modalities
- Token Limits
- Pricing
- Provider
- Provider Override
- Experimental
- Raw JSON

Use `DetailRow` for scalar values. For nested pricing tiers and experimental modes, use compact bordered blocks or muted panels. Avoid nesting cards inside cards.

The structured sections should cover currently observed `api.json` fields. The raw JSON section is the compatibility escape hatch for future fields or fields whose product meaning is not yet clear.

## Compatibility And Rollback

This task only changes frontend display behavior. Rollback is limited to reverting affected files.

Risks:

- Lobe icon slugs may not exist for every provider. The fallback chain must handle this silently.
- Model-family icon mappings may be incomplete. Missing or disputed mappings should render no icon instead of falling back to a provider logo.
- Unknown pricing must not break sorting or display.
- Detail sheet may become too dense on mobile. Sections should stay vertically stacked and scrollable.
