# Display complete models.dev metadata - Implementation Plan

## Checklist

1. Update shared types in `src/types.ts` for cost tiers, provider override `shape`, and experimental modes.
2. Add constants in `src/constants.ts` for the models.dev GitHub URL, Lobe icon base URL, and provider-id to Lobe slug mapping.
3. Update utilities in `src/lib/utils.ts`.
   - Lobe icon URL helper.
   - Logo source builder if useful.
   - Localized cost formatting support.
   - Raw JSON / metadata shaping helper if useful.
4. Update `src/components/ModelLogo.tsx` to use ordered image fallback sources.
   - Add model-family icon rendering with no provider or placeholder fallback.
5. Update `src/App.tsx` header to show the data-source link.
6. Update `src/components/ModelCard.tsx`.
   - Correct unknown/free price display.
   - Preserve current card density.
7. Update `src/components/ModelDetailSheet.tsx`.
   - Render all current `api.json` fields in readable sections.
   - Add cost tiers, context-over-200k, experimental modes, provider override, and complete raw JSON.
8. Update `src/i18n/locales/en.json` and `src/i18n/locales/zh.json` with all visible strings.
9. Run validation:
   - `pnpm lint`
   - `pnpm build`
10. Manually verify with browser if feasible:
   - default page header,
   - a model with missing cost,
   - a model with `cost.tiers`,
   - a model with `experimental.modes`,
   - a provider with Lobe icon mapping,
   - fallback provider logo behavior.
   - searchable provider selector on desktop and mobile.
   - family selector on desktop and mobile.
   - model-family icon appears for matched families and is absent for unmatched families.

## Risky Files

- `src/types.ts`: type shape must stay aligned with API usage.
- `src/lib/utils.ts`: cost formatting affects card and detail display.
- `src/components/ModelDetailSheet.tsx`: most layout and data display changes concentrate here.
- `src/components/ModelLogo.tsx`: fallback state must reset when provider/model changes.

## Validation Notes

The project has no test runner configured. Lint and build are the required automated checks. UI changes should be manually inspected with the dev server.
