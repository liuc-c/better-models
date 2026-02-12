## 2026-02-13
- Corrected price unit labels from /1K to /1M in ModelCard component and i18n files.
- Verified that upstream data is already per million tokens, so only UI label changes were needed.
- **Status Badges**: Implemented visual indicators for model status (alpha, beta, deprecated).
  - Used `Badge` component with custom Tailwind classes for specific colors (orange for alpha, blue for beta).
  - Ensured badges are only rendered when `status` is present.
  - Added translations for status labels.
  - Placed badges next to the model name in both Card and Sheet views for consistency.
