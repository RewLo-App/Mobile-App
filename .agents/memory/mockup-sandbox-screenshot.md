---
name: Screenshotting mockup-sandbox components
description: Correct path + viewport for capturing mockup-sandbox preview components as image assets
---

# Screenshotting a mockup-sandbox component

The `mockup-sandbox` artifact's preview path already includes `/__mockup/preview`.
When using the `screenshot` tool with `type: app_preview` and `artifact_dir_name: "mockup-sandbox"`,
pass **only** `path: "/{folder}/{Component}"` (e.g. `/linkedin/RewLoPayPost`).

**Why:** the tool prepends the artifact's preview path. Passing the full
`/__mockup/preview/{folder}/{Component}` doubles it → `/__mockup/preview/__mockup/preview/...`
and renders "No component found".

**How to apply:** to render an HTML/React composition into a downloadable image
(e.g. a LinkedIn marketing graphic), build a component under
`artifacts/mockup-sandbox/src/components/mockups/<folder>/`, size the root to
`100vw/100vh` with an inner fixed-size canvas, restart the Component Preview Server
workflow, then screenshot with `viewport_size` matching the canvas and `save_to`.
Reference bundled images via `/__mockup/images/<file>` after copying them into
`artifacts/mockup-sandbox/public/images/`.
