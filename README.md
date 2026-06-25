# Category Navigation — DDS V3

A production-grade React component built for the **Dell Design System V3** using `@dds-v3/react`.

## What's inside

| File | Purpose |
|------|---------|
| `src/app/App.tsx` | Component source + interactive showcase |
| `src/styles/index.css` | CSS entry point (Tailwind → DDS → globals) |
| `src/styles/globals.css` | Hover/focus state rules for `.cat-nav-*` classes |
| `src/styles/fonts.css` | DDS icon font `@font-face` declaration |
| `src/styles/theme.css` | Design-system token overrides (Tailwind `@theme`) |

## Component API

```tsx
<CategoryNavigation
  mode="scroller" | "dropdown"
  size="desktop" | "tablet" | "mobile"   // scroller only
  items={CategoryItem[]}
  selectedId={string}
  onSelect={(id: string) => void}
  initialOpen={boolean}                  // dropdown only
/>
```

## Modes

### Scroller
Horizontal pill row that scrolls when items overflow. Leading/trailing chevrons appear automatically. Three responsive sizes (desktop 44 px, tablet 52 px, mobile 36 px).

### Dropdown
Compact brand-fill trigger pill. Opens a white listbox panel below. Chevron flips up/down on open/close.

## States covered
- Pill: `selected` · `default` · `hover` · `focus-visible` · `disabled`
- Overflow chevron: `default` · `hover` · `focus-visible` · `hidden`
- Dropdown row: `default` · `hover` · `focus-visible` · `selected` · `disabled`

## Showcase

When rendered without props (e.g. in Figma Make), `CategoryNavigation` automatically shows the full interactive showcase — all modes, sizes, and frozen state grids on a single canvas.

## Token system

All visual values bind to `--dds-*` CSS variables from `@dds-v3/react`. Update design-system tokens in `src/styles/theme.css` or `src/styles/globals.css` and every state updates automatically.

## Setup

```bash
pnpm install
# @dds-v3/react resolves from the Figma private registry configured in .npmrc
```

## Built with
- `@dds-v3/react` 3.0.0
- `@make-kits/dds-v3-make-kit` 0.0.3
- Vite 6 + React 18 + TypeScript
- Tailwind CSS v4
