# Display complete models.dev metadata

## Goal

Improve trust, completeness, and data accuracy in the Better Models UI by:

- showing the models.dev data source near the app title,
- using Lobe Icons when a provider can be matched, with existing models.dev logos as fallback,
- correcting missing price data so unknown pricing is not displayed as free,
- making the detail sheet expose all currently known fields from `https://models.dev/api.json` in a readable way.

The user value is faster inspection of a model/provider without needing to open raw JSON for common metadata, while preserving a complete JSON fallback for unusual or future fields.

## Confirmed Facts

- The app is a React 19 + TypeScript + Tailwind CSS 4 Vite frontend.
- Data is fetched from `https://models.dev/api.json` through `API_URL`.
- Provider logos currently use `https://models.dev/logos/{provider}.svg`.
- `models.dev/api.json` currently contains 124 providers and 4518 models.
- Provider-level fields currently observed: `id`, `name`, `env`, `npm`, `api`, `doc`, `models`.
- Model-level fields currently observed: `id`, `name`, `family`, `attachment`, `reasoning`, `tool_call`, `structured_output`, `interleaved`, `temperature`, `knowledge`, `release_date`, `last_updated`, `modalities`, `open_weights`, `cost`, `limit`, `status`, `provider`, `experimental`.
- Cost subfields currently observed: `input`, `output`, `cache_read`, `cache_write`, `reasoning`, `input_audio`, `output_audio`, `context_over_200k`, `tiers`.
- `cost` is missing for some models, and missing cost must not be rendered as `Free`.
- Many model ids are reused across providers, so model detail selection must use provider id plus model id instead of model id alone.
- `experimental.modes` exists on a small number of models and should be visible when present.
- The user explicitly does not want provider channel / gateway / aggregator classification for now.

## Requirements

- Add a compact, localized data source description near the header title area.
  - It should link to `https://github.com/anomalyco/models.dev`.
  - It should remain readable on desktop and mobile.
- Add colored Lobe Icons as the preferred provider logo source when the provider can be matched and a color asset is available.
  - Keep a curated provider-id to Lobe slug mapping in app code.
  - Fallback to monochrome Lobe Icons, then the existing `models.dev/logos/{provider}.svg` URL when a colored asset does not exist, Lobe does not match, or a request fails.
  - Fallback to the existing initial-letter placeholder if all image sources fail.
- Correct price rendering.
  - Numeric zero cost should display as free.
  - Missing or undefined cost should display as unknown.
  - Sorting by cost should keep unknown costs at the end for ascending sorts and avoid presenting unknown values as high-value free results.
- Expand detail sheet display for current `api.json` fields.
  - Basic model metadata: id, name, family, status, model-level provider override when present.
  - Date metadata: release date, last updated, knowledge cutoff.
  - Capabilities: all capability booleans plus interleaved and temperature.
  - Modalities: input/output values.
  - Token limits: context, input, output.
  - Pricing: base costs, cache costs, reasoning/audio costs, context-over-200k costs, and tiered pricing.
  - Provider metadata: name, npm package, API endpoint, documentation link, env variables.
- Experimental metadata: experimental modes and relevant nested cost/provider values.
- Raw JSON: keep a complete raw representation available for inspection.
- Detail selection and detail URLs must preserve the selected provider id so cards and detail sheet content stay aligned for duplicate model ids.
- Provider selection should be searchable so users can quickly find a provider in the 100+ provider list.
- Model family filtering should be available next to provider filtering and derived from existing `model.family` values in the API.
- Add small colored Lobe model-family icons before model names and family filter options when the model family can be conservatively matched.
  - Match by model family first, then clear model id/name terms.
  - Do not infer model icons from provider ids.
  - Do not show a provider logo or placeholder when no model icon matches.
  - In family option lists, families with matched icons should appear before families without icons.
- Unknown or future API fields do not need bespoke UI rows immediately, but must remain visible in complete Raw JSON / additional JSON output so no data is lost.
- Maintain existing default sorting by `lastUpdated`.
- Maintain localization parity in English and Chinese.
- Do not add provider channel / gateway classification.

## Acceptance Criteria

- [ ] The header displays a localized data-source link to models.dev.
- [ ] Provider logos try colored Lobe Icons first when a mapped color slug exists, then fallback to monochrome Lobe Icons, then models.dev logos, then a letter placeholder.
- [ ] Missing cost fields render as unknown, not free, on cards and in the detail sheet.
- [ ] Zero numeric costs still render as free.
- [ ] The detail sheet displays every currently observed provider/model/cost/limit/modalities/status/experimental field in a readable section when present.
- [ ] Raw JSON remains available and includes complete model/provider context, including future or uncommon fields not yet promoted to structured UI.
- [ ] Selecting a model card opens details for the same provider/model pair, including when the same model id appears under multiple providers.
- [ ] Provider filters on desktop and mobile support searching by provider name or id.
- [ ] Family filters on desktop and mobile support selecting API-derived family values and persist through URL state.
- [ ] Model cards, detail headers, and family options show a small model-family icon when a conservative Lobe model icon match exists.
- [ ] Models and families without a conservative icon match render no model-family icon.
- [ ] Family option lists place families with matched icons before unmatched families.
- [ ] English and Chinese locale files include all new visible strings.
- [ ] Desktop and mobile layouts remain usable without header or detail content overlap.
- [ ] `pnpm lint` passes.
- [ ] `pnpm build` passes.

## Notes

- Out of scope: provider channel / gateway / official classification.
- Out of scope: changing the default sort away from last updated.
- Accepted product boundary: currently observed `api.json` fields get structured readable display; future or semantically unclear fields can remain in complete Raw JSON until intentionally promoted.
