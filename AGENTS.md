# Vue Engineering Agent

You are a senior Vue.js developer working on this app.

Always follow the existing architecture and coding patterns before introducing new ones. Prefer Vue built-ins and project utilities over new dependencies.

---

# Stack

- Vue 3 + TypeScript + Vite
- Pinia (setup stores)
- Vue Router
- vue-i18n (`legacy: false`)
- pnpm

HTTP: native `fetch` via `apiRequest` in `@/api/client` (not axios). UI: `components/inputs/*` and the
component classes declared in `src/assets/main.css` — no third-party form/UI kits.

---

# Architecture

Typical feature flow (canonical example: **user**):

```
types/ → transformers/ → api/ → pages/ → router/ (+ locales/)
```

Hard rules:

- Pages/components never build HTTP requests or map raw API payloads.
- Domain types are camelCase; API shapes use `*Api` when they differ.
- Prefer absolute imports (`@/...`).

```
src/
 api/ components/ composables/ locales/ pages/ router/ stores/ transformers/ types/ utils/
```

Pages group by domain (`pages/user/`). Placeholders may be single files under `pages/`.

| Kind        | Pattern                                          |
| ----------- | ------------------------------------------------ |
| Components  | `Loading.vue`, `NotificationMessage.vue`         |
| Composables | `useFormErrors.ts` in `src/composables/`         |
| Stores      | `stores/<id>/index.ts` (e.g. `stores/auth`)      |
| Types       | `User`, `RegistrationPayload`                    |
| API         | plural domain folders + verbs (`updateProfile`)  |
| Routes      | `camelCase` names; path segments in `kebab-case` |

Existing stores: `auth`, `user`, `notification`.

---

# New feature checklist (CRUD)

1. `types/` — domain, `*Api`, form, payloads
2. `transformers/` — API → domain helpers
3. `api/` — `apiRequest` + domain `index.ts` re-exports
4. `pages/<domain>/` — Index / New / Edit
5. `router/` — module + spread into `router/index.ts`; `meta.requiresAuth` when needed
6. Locales — `en` + `pt-BR` (`locales/common/` for shared keys; domain folders with `en.ts` / `pt-BR.ts`)

**Projects** (`pages/project/`) is the reference for list CRUDs. Reuse its generic building blocks
instead of inlining list, pagination or confirm markup in the page:

- `useInfiniteList` + `InfiniteScrollSentinel.vue` — the API paginates by cursor (`after`/`next`),
  so lists use infinite scroll; there is no numbered paginator
- `Page<T>` / `PaginationApi` in `types/api/pagination.ts`
- `ModalConfirm.vue` — confirmation dialogs (e.g. delete)
- `components/inputs/` — `InputText`, `InputDate`, `SelectInput`, `ToggleSwitch`, `CoverUpload`

Filters and sort live in the route query (`?sort=`, `?favorite=true`), not in a store.

Before adding a dependency, store, utility, or abstraction, check that an equivalent does not already exist.

---

# Styling

Plain CSS in `src/assets/main.css` — no CSS framework and no PostCSS config.

- Recurring patterns live as component classes in `main.css` (`.btn`, `.form-input`, `.panel`, ...).

---

# Testing

Unit tests use Vitest; e2e uses Playwright (mocked API in `e2e/`, real backend in `e2e/real-api/`).
Bug fixes: reproduce → fix → verify. Do not add tests unless asked.

When you finish any change or task, always run the full test suite and report the results:

```bash
pnpm test:unit --run
pnpm test:e2e
pnpm test:e2e:real-api
```

If a test fails, check whether it already failed before your change:

- **Passed before** — your change broke it: fix it (the code, or the test if the behavior change was
  intended) and run the suite again.
- **Already failing** — report it with the output; don't fix it unless asked.

Changes that touch only CSS or HTML markup (no script, logic or text changes) don't need the test run.

---

# AI Expectations

When modifying code:

- preserve existing architecture and naming
- minimize changes; keep diffs small
- avoid unrelated refactors
- do not introduce dependencies without clear justification

Prefer simple, readable solutions. Favor composition over inheritance. Keep components small and focused.

If multiple solutions exist:

1. Choose the simplest
2. Choose the most idiomatic Vue 3 approach
3. Stay consistent with the rest of this project
