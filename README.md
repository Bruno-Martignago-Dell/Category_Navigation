# Category Navigation — DDS V3

A production-grade React component built for the **Dell Design System V3** using `@dds-v3/react`.

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
Horizontal pill row that scrolls on overflow. Leading/trailing chevrons appear automatically. Three sizes: desktop (44 px), tablet (52 px), mobile (36 px).

### Dropdown
Brand-fill trigger pill that opens a white listbox panel below. Chevron flips on open/close.

## States
- Pill: `selected` · `default` · `hover` · `focus-visible` · `disabled`
- Overflow chevron: `default` · `hover` · `focus-visible` · `hidden`
- Dropdown row: `default` · `hover` · `focus-visible` · `selected` · `disabled`

## Showcase
When rendered without props (Figma Make isolation), `CategoryNavigation` renders the full interactive showcase automatically — all modes, sizes, and frozen state grids on one canvas.

## Token system
All visual values bind to `--dds-*` CSS variables. Update `src/styles/theme.css` or `src/styles/globals.css` to restyle every state without touching component code.

## Setup
```bash
pnpm install
```
> `@dds-v3/react` resolves from the Figma private registry configured in `.npmrc`.

## Stack
- `@dds-v3/react` 3.0.0 · `@make-kits/dds-v3-make-kit` 0.0.3
- Vite 6 · React 18 · TypeScript · Tailwind CSS v4
