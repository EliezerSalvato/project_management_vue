---
description: App shell — router, stores e i18n
paths:
  - "src/router/**/*.ts"
  - "src/stores/**/*.ts"
  - "src/locales/**/*.ts"
---

# App shell (router / stores / i18n)

## Routing (`src/router/`)

- Domain modules (`users.ts`) spread into `router/index.ts`.
- Names: `camelCase` (`home`, `profile`, `signIn`, `signUp`).
- Paths: `kebab-case` segments (`/users/sign-in`, `/users/sign-up`).
- Protected: `meta: { requiresAuth: true }`. Guest-only (login/register/password): `meta: { requiresGuest: true }`.
- Eager imports (not lazy) unless changing that on purpose.

Guard (`router/index.ts`): clears notification on navigate; restores session when needed; on `requiresAuth` redirects unauthenticated users to `signIn?redirect=`; on `requiresGuest` redirects authenticated users to `home`.

## Pinia (`src/stores/<id>/index.ts`)

Setup stores only: `defineStore('id', () => { ... })`. Expose state, computed, actions — no view-specific logic.

Existing: `auth` (token, remember-me, refresh/logout), `user`, `notification` (`success` | `danger`).

## i18n (`src/locales/`)

All UI copy via `useI18n()` / `t()` — never hardcode strings.

Locales: `en` and `pt-BR` (always add both). Shared labels (`buttons`, `notFound`) → `locales/common/en.ts` and `locales/common/pt-BR.ts`. Domain copy → `locales/<domain>/en.ts` and `locales/<domain>/pt-BR.ts` (e.g. `auth`, `user`).
