# Projects Context

**Gathered:** 2026-11-05
**Spec:** `.specs/features/projects/spec.md`
**Status:** Ready for design once the spec is approved

---

## Feature Boundary

List, sort, favorite, search (with 5 recent searches in `localStorage`), create, edit and remove the
signed-in user's projects, matching the captures in `captures/`, against the existing Rails API with no
API changes.

---

## Implementation Decisions

### Favorites filter

- Toggle rendered, no action. User: "deixe sem ação, eu vou implementar na api depois" (AD-001).
- The star on each card uses `POST`/`DELETE /api/v1/projects/:id/favorite`.

### Pagination

- Infinite scroll. User: "Scroll infinito" (AD-003).

### Cover removal on edit

- Trash icon removes a saved cover: hidden at once, `remove_cover_image=true` sent on save (AD-002 superseded 2026-11-07, API now supports it).

### Header

- Logo + search only. User: "Seguir a tela (Recommended)".

### Agent's Discretion

None delegated.

### Declined / Undiscussed Gray Areas → Assumptions

Routes, sort in URL, search trigger and minimum length, recent-search storage key, highlight rule,
empty search message, validation timing, edit date rule, cover file check, date display, count source,
failure handling, narrow widths and font loading - each logged with `n` in the spec's Assumptions table
for the user to correct.

---

## Specific References

- Captures in `captures/` bind (copied from `design/screens/`).
- `design/files/style.css`, `design/files/logo.png`, `design/icons/`.

---

## Deferred Ideas

- Favorites filter on `GET /api/v1/projects` (API, by the user).
- Cover removal on `PATCH /api/v1/projects/:id` (API, by the user).
- Profile / logout access from the header.
