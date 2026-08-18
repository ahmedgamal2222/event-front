# Frontend Implementation Guide

## Vision
- Click ANY element in live preview → edit text, color, size, direction, position, spacing, border, shadow, visibility.
- Hero section supports: external image, uploaded image, YouTube/Vimeo video, direct video file, solid/gradient color.
- Changes save to `site_config.frontend` and render dynamically on the event page.

## Architecture
- `app/components/admin/AdminFrontendEditor.tsx` — main editor UI.
- `app/components/admin/VisualEditor.tsx` — reusable property panel.
- `app/[slug]/Client.tsx` — renders dynamic frontend sections with editable wrappers.
- `lib/types.ts` — `FrontendSection`, `FrontendElement`, `EditableStyle` interfaces.

## Data Model
- `site_config.frontend.sections[]`
  - `id`, `type`, `order`, `visible`
  - `elements[]` → `id`, `selector`, `tag`, `text`, `html`, `src`, `alt`, `href`, `styles{}`, `classes[]`

## Edit Actions
- Text content
- HTML content
- Image/video src
- Link href
- Colors (text, bg, border)
- Typography (size, weight, family)
- Spacing (margin, padding)
- Border (width, style, radius, color)
- Shadow
- Direction (ltr/rtl)
- Position (static/fixed/absolute/relative/sticky)
- Visibility (show/hide)
- Alignment (text-align, flex justify/items)
- Z-index
- Width/Height/Max-width
- Opacity
- Transition/Duration

## Delivery
- Phase 1: Infrastructure + Hero background editor.
- Phase 2: Click-to-edit overlay + property panel.
- Phase 3: Advanced positioning + animations.
