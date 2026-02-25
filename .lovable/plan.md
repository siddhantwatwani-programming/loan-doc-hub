

## Improve Left Panel Logo Appearance

### Current State
The logo (`logo-new.png`) is displayed as a plain image at `h-11` height inside a cramped `h-12` header row. It has basic dark mode filters but no visual polish — no padding, no background treatment, and it sits flush against the hamburger button.

### Proposed Changes

**File: `src/components/layout/AppSidebar.tsx`**

1. **Add vertical breathing room** — Increase the logo section height from `h-12` to `h-14` and add slight vertical padding so the logo isn't squeezed against borders.

2. **Center the logo better** — Add `justify-center` to the logo container when expanded, giving it a more intentional, branded feel rather than left-aligned flush.

3. **Add subtle background accent** — Give the logo section a very subtle gradient or slightly different background tone (`bg-sidebar/80`) to visually separate it as a branded header area.

4. **Refine dark mode treatment** — Improve the dark mode filters: soften the brightness boost from `1.8` to `1.6`, and add a subtle glow effect using a refined drop-shadow for better legibility without harshness.

5. **Add smooth hover interaction** — Add a subtle scale transition on hover (`hover:scale-[1.02] transition-transform`) to make the logo feel polished and interactive.

6. **Improve collapsed state** — When collapsed, show a small version of the logo (or a compact icon placeholder) instead of showing nothing, so the brand presence is maintained.

### Technical Details

Changes limited to the logo section (lines 182-198) of `AppSidebar.tsx`:
- Logo container: `h-14 px-4` with a bottom border and optional subtle gradient
- Image element: refined className with hover transition, adjusted dark mode filters
- Collapsed state: show logo at `h-6 w-6 rounded` as a compact brand mark
- No changes to any other sidebar functionality, layout, or navigation

