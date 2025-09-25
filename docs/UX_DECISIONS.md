# UX decisions: forms vs modals

Date: 2025-09-23
Status: Accepted

## Decision
- Keep long/primary forms as full pages (login, setup admin, full "Nowy klient").
- Use no modals for now. Defer Dialog/AlertDialog/Sheet and intercepting routes.
- Revisit later for small, low-risk actions (e.g., add note, delete confirm) once flows are stable.

## Rationale
- Lowest implementation risk: fewer a11y/hydration edge cases, simpler routing, better linkability and history.
- Faster iteration: less plumbing (portals, focus trap, scroll lock, intercepting routes).
- Clear URLs and navigation: back/forward works intuitively; easy deep-linking.

## Scope & impact
- Current pages remain as-is: `/login`, `/setup`, `/clients/new`, `/clients/[id]`.
- No additional UI dependencies required.
- Future: if needed, introduce Dialog/AlertDialog via a mature lib (e.g., shadcn/ui) only for short actions.

## Notes
- When/if we add modals:
  - Use library-provided components (focus trap, aria, escape-close, backdrop click) to minimize risk.
  - Keep server reads SSR; client-side forms submit to API routes or server actions.
  - Provide fallback to a full page for long or linkable flows.

## Micro-animations (guideline)
- Prefer subtle, fast transitions (180–250ms, ease-out) for navigation (sidebar open/close, overlay fade) and theme switching (colors/backgrounds/borders).
- Respect prefers-reduced-motion and disable animations in that case.
- Avoid heavy motion; use transform/opacity for performance.
