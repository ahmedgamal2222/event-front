# WYSIWYG Editor System

## Plan
1. Fix upload JSON.parse error in `lib/api.ts` or upload endpoint.
2. Add `EditableWrapper` component for wrapping any element.
3. Add `PropertyPanel` component for editing styles/text/position.
4. Add `NavbarEditor` component for navbar-specific controls.
5. Integrate editor mode into event page preview.
6. Add hero background editor (image/video/youtube/upload).

## Components
- `app/components/admin/EditableWrapper.tsx`
- `app/components/admin/PropertyPanel.tsx`
- `app/components/admin/NavbarEditor.tsx`
- `app/components/admin/HeroBackgroundEditor.tsx`

## Editor Mode
- Toggle `?edit=1` or admin session to enable.
- Click any element → highlight + show property panel.
- Editable: text, color, fontSize, fontWeight, bg, border, padding, margin, direction, position, visibility, link href, image src, video src.

## Upload Fix
- Ensure upload endpoint returns `{ success: true, url: ... }` only.
- Client expects JSON.parse on response text; must not include extra chars.
