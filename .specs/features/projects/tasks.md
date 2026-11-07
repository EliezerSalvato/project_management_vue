# Projects Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/projects/design.md`
**Status**: Done (uncommitted) - one screen open: search-bar top border (C55)
**Approved**: 2026-11-05 - user: "aprovado"
**Build**: `pnpm build; pnpm lint`
**Run unit**: `pnpm exec vitest run --reporter=verbose`
**Run e2e**: `pnpm exec playwright test e2e/projects --reporter=list`

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md` ("No test setup yet... Do not add tests unless asked" - outdated: the repo has Vitest and Playwright suites since `e4da006`/`4426d40`; the skill's rule "tests derive from the acceptance criteria" applies), `vitest.config.ts`, `playwright.config.ts`, `tsconfig.vitest.json` (`src/**/__tests__/*`). No coverage threshold configured - strong defaults applied. No component test library (`@vue/test-utils`) is installed, so components and pages are proven through the mocked Playwright suite, as the existing user pages are.

| Code Layer                          | Required Test Type | Coverage Expectation                                                     | Location Pattern                       | Run Command                              |
| ----------------------------------- | ------------------ | ------------------------------------------------------------------------ | -------------------------------------- | ---------------------------------------- |
| Utils / validators (`src/utils/**`) | unit               | All branches; 1:1 to the spec ACs they implement; every listed edge case | `src/utils/**/__tests__/*.spec.ts`     | `pnpm exec vitest run`                   |
| Composables (`src/composables/*`)   | unit               | All branches; 1:1 to ACs (pagination, recent searches, click outside)    | `src/composables/__tests__/*.spec.ts`  | `pnpm exec vitest run`                   |
| Transformers                        | unit               | Every field mapping; optional cover present/absent                       | `src/transformers/__tests__/*.spec.ts` | `pnpm exec vitest run`                   |
| API functions + client              | unit               | Method, path, query, body per function; FormData header                  | `src/api/__tests__/*.spec.ts`          | `pnpm exec vitest run`                   |
| Components + pages + router         | e2e (mocked API)   | Every AC of the page: happy path + edge + error paths                    | `e2e/projects/*.spec.ts`               | `pnpm exec playwright test e2e/projects` |
| Types, locales, CSS, e2e support    | none               | build gate only                                                          | -                                      | `pnpm build; pnpm lint`                  |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use                                              | Command                                                                        |
| ---------- | -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Quick      | After tasks with unit tests only                         | `pnpm exec vitest run`                                                         |
| Full       | After tasks with e2e tests                               | `pnpm exec vitest run && pnpm exec playwright test`                            |
| Build      | After phase completion or type/locale/support-only tasks | `pnpm build && pnpm lint && pnpm exec vitest run && pnpm exec playwright test` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Data layer

```
T1 → T3 → T4
T2 → T4
T5
```

### Phase 2: Client-side rules

```
T6 → T7
T9 → T10
T8
T11
T12
```

### Phase 3: Projects list page

```
T13 → T14 → T15 → T16 → T17
T14 → T18 → T19
```

### Phase 4: Remove and search

```
T20 → T22
T21 → T22
```

### Phase 5: Create and edit

```
T23 → T24 → T25 → T26
```

### Phase 6: Screens

```
T27
```

---

## Task Breakdown

### T1: Create project and pagination types

**What**: Domain, API and form types for projects plus the generic `Page<T>` / `PaginationApi`.
**Where**: `src/types/project/` (`project.ts`, `list.ts`, `form.ts`, `index.ts`) and `src/types/api/pagination.ts`
**Depends on**: None
**Reuses**: `src/types/api/jsonApi.ts`, `src/types/user/` layout
**Requirement**: PROJ-01

**Done when**:

- [x] Types match design.md Data Models; `Page`/`PaginationApi` exported from `@/types/api`
- [x] `pnpm build` passes

**Tests**: none
**Gate**: build
**Commit**: `feat(project): add project and pagination types`
**Status**: Done (uncommitted)

---

### T2: Send FormData bodies from apiRequest

**What**: `apiRequest` omits `Content-Type` when `body` is `FormData`.
**Where**: `src/api/client.ts` (modify)
**Depends on**: None
**Reuses**: existing headers logic
**Requirement**: PROJ-07

**Done when**:

- [x] Unit test in `src/api/__tests__/client.spec.ts`: FormData request has no `Content-Type`, JSON request keeps `application/json`
- [x] Gate check passes: `pnpm exec vitest run`; no existing test deleted

**Tests**: unit
**Gate**: quick
**Commit**: `feat(api): send FormData bodies without a JSON content type`
**Status**: Done (uncommitted)

---

### T3: Add project transformers

**What**: `projectFromResource`, `projectListFromApi`, `projectFormTransformer.toFormData` / `fromProject`.
**Where**: `src/transformers/project/` (`project.ts`, `projectList.ts`, `projectForm.ts`, `index.ts`)
**Depends on**: T1
**Reuses**: `keysToCamelCase`, `src/transformers/user/user.ts` pattern
**Requirement**: PROJ-01, PROJ-07, PROJ-09

**Done when**:

- [x] `src/transformers/__tests__/project.spec.ts`: resource → `Project` (null cover), list → `Page`, FormData snake_case keys, `cover_image` only with a `File`
- [x] Gate check passes: `pnpm exec vitest run`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(project): add project transformers`
**Status**: Done (uncommitted)

---

### T4: Add projects API functions

**What**: `listProjects`, `getProject`, `createProject`, `updateProject`, `deleteProject`, `createFavorite`, `deleteFavorite`.
**Where**: `src/api/projects/` (`projects.ts`, `favorites.ts`, `index.ts`)
**Depends on**: T2, T3
**Reuses**: `apiRequest`, `src/api/user/*` pattern
**Requirement**: PROJ-02, PROJ-04, PROJ-05, PROJ-07, PROJ-09, PROJ-10, PROJ-11

**Done when**:

- [x] `src/api/__tests__/projects.spec.ts`: method, path and query (`page`, `sort`, `search` only when set) per function; create/update send FormData; results transformed
- [x] Gate check passes: `pnpm exec vitest run`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(project): add projects api`
**Status**: Done (uncommitted)

---

### T5: Extend the e2e API mock for projects

**What**: Record the query string and the raw body of non-JSON requests; add project response builders.
**Where**: `e2e/support/fixtures.ts` (modify) and `e2e/support/projects.ts` (new)
**Depends on**: None
**Reuses**: `ApiMock`, `errorResponse`, `messageResponse`
**Requirement**: PROJ-13

**Done when**:

- [x] `RecordedRequest` gains `query: URLSearchParams` and `rawBody: string | null`; JSON bodies still parsed into `body`, multipart no longer throws
- [x] `projectResource()`, `projectsPage()` builders; existing e2e suites still pass: `pnpm exec playwright test`

**Tests**: none
**Gate**: build
**Commit**: `test(e2e): support query and multipart in the api mock`
**Status**: Done (uncommitted)

---

### T6: Add date utils

**What**: `parseIsoDate`, `todayIso`, `formatLongDate`.
**Where**: `src/utils/date.ts`
**Depends on**: None
**Reuses**: `AppLocale` from `@/locales/locale`
**Requirement**: PROJ-01, PROJ-06

**Done when**:

- [x] `src/utils/__tests__/date.spec.ts`: local calendar parsing (no UTC shift), impossible dates → null, pt-BR "01 de setembro de 2024", en "September 01, 2024"
- [x] Gate check passes: `pnpm exec vitest run`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(utils): add date parsing and formatting helpers`
**Status**: Done (uncommitted)

---

### T7: Add word, date and cover-file validators

**What**: `minWordsValidator`, `dateValidator`, `coverFileValidator`.
**Where**: `src/utils/validators/` (`words.ts`, `date.ts`, `file.ts`, `index.ts`)
**Depends on**: T6
**Reuses**: `Validator`, `ValidationResult`, `isBlank`
**Requirement**: PROJ-06, PROJ-09

**Done when**:

- [x] `src/utils/validators/__tests__/validators.spec.ts` extended: one word / blank / Unicode spaces; empty, malformed, past, before start, `check: false`; MIME and 5 MB boundary (5 MB passes, 5 MB + 1 fails)
- [x] Gate check passes: `pnpm exec vitest run`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(utils): add word, date and cover file validators`
**Status**: Done (uncommitted)

---

### T8: Add search highlight util

**What**: `highlightSegments(text, term)`.
**Where**: `src/utils/highlight.ts`
**Depends on**: None
**Reuses**: -
**Requirement**: PROJ-11

**Done when**:

- [x] `src/utils/__tests__/highlight.spec.ts`: case- and accent-insensitive, several matches, no match, empty term, original characters kept
- [x] Gate check passes: `pnpm exec vitest run`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(utils): add search term highlight helper`
**Status**: Done (uncommitted)

---

### T9: Add recent searches util

**What**: `readRecentSearches`, `addRecentSearch`, `removeRecentSearch`, `writeRecentSearches`.
**Where**: `src/utils/recentSearches.ts`
**Depends on**: None
**Reuses**: -
**Requirement**: PROJ-12

**Done when**:

- [x] `src/utils/__tests__/recentSearches.spec.ts`: max 5 dropping the oldest, newest first, case-insensitive dedupe to top, remove, missing/invalid JSON/non-string items → `[]`
- [x] Gate check passes: `pnpm exec vitest run`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(utils): add recent searches storage helpers`
**Status**: Done (uncommitted)

---

### T10: Add useRecentSearches composable

**What**: Reactive recent searches keyed by the signed-in user's id.
**Where**: `src/composables/useRecentSearches.ts`
**Depends on**: T9
**Reuses**: `useUserStore`
**Requirement**: PROJ-12

**Done when**:

- [x] `src/composables/__tests__/useRecentSearches.spec.ts`: key `projects.recentSearches.<userId>`, add/remove persist to `localStorage`
- [x] Gate check passes: `pnpm exec vitest run`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(project): add recent searches composable`
**Status**: Done (uncommitted)

---

### T11: Add useInfiniteList composable

**What**: Generic paginated list with `loadMore`, `reset`, `remove`, `replace`.
**Where**: `src/composables/useInfiniteList.ts`
**Depends on**: T1
**Reuses**: `Page<T>`
**Requirement**: PROJ-02, PROJ-13

**Done when**:

- [x] `src/composables/__tests__/useInfiniteList.spec.ts`: appends next page, no request while loading, none after the last page, no skip after a removal, `remove` decrements count, `reset` starts at page 1, error exposed
- [x] Gate check passes: `pnpm exec vitest run`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(composables): add infinite list composable`
**Status**: Done (uncommitted)

---

### T12: Add useClickOutside composable

**What**: Calls a handler on outside pointerdown and on Escape while enabled.
**Where**: `src/composables/useClickOutside.ts`
**Depends on**: None
**Reuses**: -
**Requirement**: PROJ-04, PROJ-08, PROJ-11

**Done when**:

- [x] `src/composables/__tests__/useClickOutside.spec.ts`: outside click and Escape call it, inside click doesn't, disabled doesn't
- [x] Gate check passes: `pnpm exec vitest run`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(composables): add click outside composable`
**Status**: Done (uncommitted)

---

### T13: Add projects routes, header and list page with empty state

**What**: `router/projects.ts`, `/` → `projects`, `AppHeader`, `pages/project/Index.vue` with first-page load, error notification and the empty state; project locales; font and base tokens. Deletes `Home.vue`.
**Where**: `src/pages/project/Index.vue` (+ `src/router/projects.ts`, `src/components/AppHeader.vue`, `src/locales/project/{en,pt-BR}.ts`, `src/assets/main.css`, `index.html`)
**Depends on**: T4, T5
**Reuses**: `Loading`, `NotificationMessage`, router guard, `design/files/logo.png` (copied to `src/assets/`)
**Requirement**: PROJ-01, PROJ-03

**Done when**:

- [x] Empty state matches `.specs/features/projects/captures/projects-empty-list.png`
- [x] `e2e/projects/list.spec.ts`: empty state, "Novo projeto" navigation, error, signed-out redirect for all four routes, `/` redirect, header content, logo link, session expiry
- [x] Gate check passes: `pnpm exec vitest run && pnpm exec playwright test`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(project): add projects list page with empty state`
**Status**: Done (uncommitted)

---

### T14: Add project cards grid

**What**: `ProjectCard` (cover/placeholder, name, client, dates, wrapping) and `ProjectGrid`; count in the title.
**Where**: `src/components/project/ProjectCard.vue` (+ `ProjectGrid.vue`, `Index.vue`, `main.css`)
**Depends on**: T13
**Reuses**: `formatLongDate`, `design/icons/calendar-day-light.svg`, `Vector.svg`
**Requirement**: PROJ-01, PROJ-13

**Done when**:

- [x] Grid matches `.specs/features/projects/captures/projects-list.png`
- [x] `e2e/projects/list.spec.ts`: cards content, count from API, placeholder, wrapping and aligned dividers
- [x] Gate check passes: `pnpm exec vitest run && pnpm exec playwright test`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(project): show projects as cards`
**Status**: Done (uncommitted)

---

### T15: Load more projects on scroll

**What**: `InfiniteScrollSentinel` + `useInfiniteList` wiring in the grid with the next-page `Loading`.
**Where**: `src/components/InfiniteScrollSentinel.vue` (+ `ProjectGrid.vue`, `Index.vue`)
**Depends on**: T14, T11
**Reuses**: `useInfiniteList`, `Loading`
**Requirement**: PROJ-02

**Done when**:

- [x] `e2e/projects/infiniteScroll.spec.ts`: appends page 2, loading indicator, no request after the last page
- [x] Gate check passes: `pnpm exec vitest run && pnpm exec playwright test`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(project): load more projects on scroll`
**Status**: Done (uncommitted)

---

### T16: Sort projects

**What**: `SelectInput` with the three options; sort in `?sort=`, reload from page 1.
**Where**: `src/components/inputs/SelectInput.vue` (+ `Index.vue`, `main.css`)
**Depends on**: T15, T12
**Reuses**: `useClickOutside`
**Requirement**: PROJ-04

**Done when**:

- [x] Open select matches `.specs/features/projects/captures/projects-select-order.png`
- [x] `e2e/projects/sort.spec.ts`: options, pick → request + URL, invalid/absent default, reload, outside/Escape
- [x] Gate check passes: `pnpm exec vitest run && pnpm exec playwright test`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(project): sort the projects list`
**Status**: Done (uncommitted)

---

### T17: Add the inert favorites toggle

**What**: `ToggleSwitch` "Apenas Favoritos", off, no action (AD-001).
**Where**: `src/components/inputs/ToggleSwitch.vue` (+ `Index.vue`, `main.css`)
**Depends on**: T16
**Reuses**: -
**Requirement**: PROJ-05

**Done when**:

- [x] Toggle matches its place in `.specs/features/projects/captures/projects-list.png`
- [x] `e2e/projects/list.spec.ts`: click changes neither toggle nor list nor requests
- [x] Gate check passes: `pnpm exec vitest run && pnpm exec playwright test`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(project): add favorites toggle placeholder`
**Status**: Done (uncommitted)

---

### T18: Favorite a project from its card

**What**: Star button + `useProjectActions.toggleFavorite` (in-flight guard, error notification).
**Where**: `src/composables/useProjectActions.ts` (+ `ProjectCard.vue`, `Index.vue`)
**Depends on**: T14
**Reuses**: `createFavorite`, `deleteFavorite`, `useInfiniteList.replace`, `favorite.svg`, `favorited.svg`
**Requirement**: PROJ-05

**Done when**:

- [x] `e2e/projects/favorite.spec.ts`: POST fills, DELETE empties, failure keeps + error, clicks ignored in flight
- [x] Gate check passes: `pnpm exec vitest run && pnpm exec playwright test`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(project): favorite projects from the card`
**Status**: Done (uncommitted)

---

### T19: Add the card options menu

**What**: "..." menu with Editar / Remover (Remover emits only), one open at a time.
**Where**: `src/components/project/ProjectCard.vue` (+ `ProjectGrid.vue`, `main.css`)
**Depends on**: T18, T12
**Reuses**: `useClickOutside`, `edit.svg`, `trash-1.svg`
**Requirement**: PROJ-08

**Done when**:

- [x] Open menu matches `.specs/features/projects/captures/projects-item-options.png`
- [x] `e2e/projects/cardMenu.spec.ts`: open/close others, outside/Escape, Editar navigates
- [x] Gate check passes: `pnpm exec vitest run && pnpm exec playwright test`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(project): add project card options menu`
**Status**: Done (uncommitted)

---

### T20: Remove a project with confirmation

**What**: `ModalConfirm` + `useProjectActions.removeProject`.
**Where**: `src/components/ModalConfirm.vue` (+ `useProjectActions.ts`, `Index.vue`, `main.css`)
**Depends on**: T19
**Reuses**: `deleteProject`, `useInfiniteList.remove`, `trash.svg`
**Requirement**: PROJ-10

**Done when**:

- [x] Modal matches `.specs/features/projects/captures/modal-remove-project.png`
- [x] `e2e/projects/remove.spec.ts`: name shown, cancel/backdrop/Escape, confirm, in-flight disabled, failure, last project → empty state
- [x] Gate check passes: `pnpm exec vitest run && pnpm exec playwright test`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(project): remove a project with confirmation`
**Status**: Done (uncommitted)

---

### T21: Add the header search bar with recent searches

**What**: `SearchBar` opened from `AppHeader`: focus, placeholder, Enter ≥ 3 chars, recent list with remove, close on outside/Escape.
**Where**: `src/components/project/SearchBar.vue` (+ `AppHeader.vue`, `main.css`)
**Depends on**: T13, T10, T12
**Reuses**: `useRecentSearches`, `useClickOutside`, `search-icon.svg`
**Requirement**: PROJ-11, PROJ-12

**Done when**:

- [x] Open bar matches `.specs/features/projects/captures/search-bar.png`
- [x] `e2e/projects/search.spec.ts` (bar and recent cases)
- [x] Gate check passes: `pnpm exec vitest run && pnpm exec playwright test`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(project): add header search with recent searches`
**Status**: Done (uncommitted)

---

### T22: Add the search result page

**What**: `pages/project/Search.vue`: term in the bar, "Voltar", "Resultado da busca", grid with highlight, empty message, favorite/menu/remove/scroll.
**Where**: `src/pages/project/Search.vue` (+ `router/projects.ts`, `ProjectCard.vue`)
**Depends on**: T20, T21
**Reuses**: `ProjectGrid`, `useInfiniteList`, `useProjectActions`, `highlightSegments`, `arrow-left.svg`
**Requirement**: PROJ-11

**Done when**:

- [x] Page matches `.specs/features/projects/captures/projects-search-result.png`
- [x] `e2e/projects/search.spec.ts` (result cases)
- [x] Gate check passes: `pnpm exec vitest run && pnpm exec playwright test`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(project): add search result page`
**Status**: Done (uncommitted)

---

### T23: Add the project form and the new project page

**What**: `ProjectForm` (fields, `(Obrigatório)` labels, blur-time errors, disabled submit, 255 limit) with `InputDate`; `pages/project/New.vue` with "Voltar". No submit yet.
**Where**: `src/components/project/ProjectForm.vue` (+ `src/components/inputs/InputDate.vue`, `InputText.vue`, `pages/project/New.vue`, `main.css`)
**Depends on**: T7, T13
**Reuses**: `InputText`, `useFormErrors`, validators
**Requirement**: PROJ-06

**Done when**:

- [x] Form matches `.specs/features/projects/captures/new-project.png` and `.specs/features/projects/captures/new-project-validations.png`
- [x] `e2e/projects/newProject.spec.ts`: empty state, each field error, 255 limit, disabled while invalid, Voltar
- [x] Gate check passes: `pnpm exec vitest run && pnpm exec playwright test`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(project): add project form and new project page`
**Status**: Done (uncommitted)

---

### T24: Add the cover upload field

**What**: `CoverUpload`: drop zone, "Selecionar" (accept jpg/png), preview, file check error, trash clears a picked file, trash on saved cover removes it on save (AD-002 superseded).
**Where**: `src/components/inputs/CoverUpload.vue` (+ `ProjectForm.vue`, `main.css`)
**Depends on**: T23
**Reuses**: `coverFileValidator`, `Vector.png`, `trash.svg`
**Requirement**: PROJ-06

**Done when**:

- [x] `e2e/projects/newProject.spec.ts`: accept attribute, preview, invalid file error, trash clears
- [x] Gate check passes: `pnpm exec vitest run && pnpm exec playwright test`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(project): add cover image upload field`
**Status**: Done (uncommitted)

---

### T25: Create a project

**What**: New page submits `createProject`, loading state, single request, 422 mapping, redirect + success message.
**Where**: `src/pages/project/New.vue` (modify)
**Depends on**: T24
**Reuses**: `createProject`, `useFormErrors.applyCatch`, notification store
**Requirement**: PROJ-07, PROJ-13

**Done when**:

- [x] `e2e/projects/newProject.spec.ts`: multipart body, redirect + message, in-flight disabled, one request on double click, 422 under fields
- [x] Gate check passes: `pnpm exec vitest run && pnpm exec playwright test`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(project): create projects`
**Status**: Done (uncommitted)

---

### T26: Edit a project

**What**: `pages/project/Edit.vue`: load, NotFound on 404, saved cover with inert trash, changed-date rule, PATCH multipart, 422, Voltar.
**Where**: `src/pages/project/Edit.vue` (+ `router/projects.ts`)
**Depends on**: T25
**Reuses**: `ProjectForm`, `getProject`, `updateProject`, `NotFound.vue`
**Requirement**: PROJ-09

**Done when**:

- [x] Page matches `.specs/features/projects/captures/edit-project.png`
- [x] `e2e/projects/editProject.spec.ts`: all PROJ-09 cases
- [x] Gate check passes: `pnpm exec vitest run && pnpm exec playwright test`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(project): edit projects`
**Status**: Done (uncommitted)

---

### T27: Add the screens capture spec

**What**: Playwright spec, skipped unless `CAPTURE_SCREENS=1`, that opens each captured state in pt-BR at its capture's size with sample data like the capture's and saves `.specs/features/projects/captures/<capture>.running.png`.
**Where**: `e2e/projects/screens.spec.ts`
**Depends on**: T26, T22
**Reuses**: `ApiMock`, `e2e/support/projects.ts`
**Requirement**: PROJ-01, PROJ-04, PROJ-06, PROJ-08, PROJ-09, PROJ-10, PROJ-11

**Done when**:

- [x] `CAPTURE_SCREENS=1 pnpm exec playwright test e2e/projects/screens.spec.ts` writes the 10 pictures (all captures except the deferred `projects-list-favorites.png`)
- [x] Gate check passes: `pnpm build && pnpm lint && pnpm exec vitest run && pnpm exec playwright test`

**Tests**: e2e
**Gate**: build
**Commit**: `test(e2e): capture project screens at design size`
**Status**: Done (uncommitted)

---

## Checks

### P1: Browse projects (PROJ-01, PROJ-02, PROJ-03)

**C1** - With no projects, `/projects` shows "Nenhum projeto" / "Novo projeto" as in `projects-empty-list.png` (PROJ-01, AC 1)
Proof: run e2e | ✓ Projects list › shows the empty state when the user has no projects
Proof: browser captures/projects-empty-list.running.png

**C2** - With projects, one card each with cover or placeholder, name, "Cliente:", client, start and end dates, as in `projects-list.png` (PROJ-01, AC 2)
Proof: run e2e | ✓ Projects list › shows one card per project with name, client and dates
Proof: run unit | ✓ formatLongDate > formats pt-BR as 01 de setembro de 2024
Proof: browser captures/projects-list.running.png

**C3** - The title shows the API's `pagination.count` in parentheses, e.g. "(25)" with 20 cards loaded (PROJ-01, AC 3)
Proof: run e2e | ✓ Projects list › shows the total count from the API next to the title

**C4** - A project without cover shows the placeholder icon (PROJ-01, AC 4)
Proof: run e2e | ✓ Projects list › shows the placeholder when a project has no cover

**C5** - "Novo projeto" in the empty state and in the list header goes to `/projects/new` (PROJ-03, AC 5)
Proof: run e2e | ✓ Projects list › navigates to the new project page from the empty state and the header button

**C6** - Reaching the end of the grid loads the next page and appends its cards (PROJ-02, AC 6)
Proof: run e2e | ✓ Projects infinite scroll › loads and appends the next page at the end of the grid
Proof: run unit | ✓ useInfiniteList > appends the next page after the loaded items

**C7** - While a page loads, `Loading` shows below the grid and the page is not requested twice (PROJ-02, AC 7)
Proof: run e2e | ✓ Projects infinite scroll › shows the loading indicator while the next page loads
Proof: run unit | ✓ useInfiniteList > ignores loadMore while a page is loading

**C8** - After the last page, scrolling makes no list request (PROJ-02, AC 8)
Proof: run e2e | ✓ Projects infinite scroll › stops requesting after the last page
Proof: run unit | ✓ useInfiniteList > makes no request after the last page

**C9** - A failed list request shows the API error message (PROJ-03, AC 9)
Proof: run e2e | ✓ Projects list › shows the API error when the list fails

**C10** - Signed out, each `/projects` route redirects to sign-in with `redirect` (PROJ-03, AC 10)
Proof: run e2e | ✓ Projects list › redirects a signed-out user from every projects route to sign-in

**C11** - Signed in, `/` redirects to `/projects` (PROJ-03, AC 11)
Proof: run e2e | ✓ Projects list › redirects the root path to the projects list

**C12** - The header holds the centered logo and the search icon only (PROJ-01, AC 12)
Proof: run e2e | ✓ Projects list › shows only the logo and the search icon in the header

**C13** - Clicking the logo goes to `/projects` (PROJ-01, AC 13)
Proof: run e2e | ✓ Projects list › logo navigates to the projects list

### P1: Sort projects (PROJ-04)

**C14** - The open select lists "Ordem alfabética", "Iniciados mais recentes", "Prazo mais próximo" as in `projects-select-order.png` (PROJ-04, AC 1)
Proof: run e2e | ✓ Projects sort › lists the three sort options
Proof: browser captures/projects-select-order.running.png

**C15** - Picking an option requests page 1 with `sort=name|recent_start|nearest_deadline` and closes the select (PROJ-04, AC 2)
Proof: run e2e | ✓ Projects sort › reloads from page 1 with the picked sort and closes the select

**C16** - No or invalid `?sort=` uses `name` (PROJ-04, AC 3)
Proof: run e2e | ✓ Projects sort › uses name when the URL has no valid sort

**C17** - Reloading with `?sort=recent_start` keeps that option and order (PROJ-04, AC 4)
Proof: run e2e | ✓ Projects sort › keeps the sort from the URL after reload

**C18** - Outside click or Escape closes the select with no new request (PROJ-04, AC 5)
Proof: run e2e | ✓ Projects sort › closes on outside click and Escape without changing the order
Proof: run unit | ✓ useClickOutside > calls the handler on an outside click and on Escape

### P1: Favorite a project (PROJ-05)

**C19** - Clicking an empty star sends `POST .../favorite` and shows the filled star (PROJ-05, AC 1)
Proof: run e2e | ✓ Project favorite › favorites a project with POST and fills the star

**C20** - Clicking a filled star sends `DELETE .../favorite` and shows the empty star (PROJ-05, AC 2)
Proof: run e2e | ✓ Project favorite › unfavorites a project with DELETE and empties the star

**C21** - A failed favorite request keeps the star and shows the error (PROJ-05, AC 3)
Proof: run e2e | ✓ Project favorite › keeps the star and shows the error when the request fails

**C22** - A second click while in flight sends no second request (PROJ-05, AC 4)
Proof: run e2e | ✓ Project favorite › ignores clicks while the request is in flight

**C23** - The "Apenas Favoritos" toggle stays off and clicking it changes neither list nor requests (PROJ-05, AC 5)
Proof: run e2e | ✓ Projects list › favorites toggle stays off and does not change the list

### P1: Create a project (PROJ-06, PROJ-07)

**C24** - `/projects/new` shows the form in `new-project.png` with "Salvar projeto" disabled (PROJ-06, AC 1)
Proof: run e2e | ✓ New project › shows the empty form with the save button disabled
Proof: browser captures/new-project.running.png

**C25** - A one-word name shows "Por favor, digite ao menos duas palavras" after blur, as in `new-project-validations.png` (PROJ-06, AC 2)
Proof: run e2e | ✓ New project › shows the two-words error on the name after blur
Proof: run unit | ✓ minWordsValidator > rejects fewer words than the minimum after trimming
Proof: browser captures/new-project-validations.running.png

**C26** - A blank client shows "Por favor, digite ao menos uma palavra" (AD-004) (PROJ-06, AC 3)
Proof: run e2e | ✓ New project › shows the one-word error on a blank client after blur

**C27** - An empty or past start date shows "Selecione uma data válida" (PROJ-06, AC 4)
Proof: run e2e | ✓ New project › shows the date error on a start date before today
Proof: run unit | ✓ dateValidator > rejects empty, malformed and past dates

**C28** - An end date before the start date shows "Selecione uma data válida" (PROJ-06, AC 5)
Proof: run e2e | ✓ New project › shows the date error on an end date before the start date
Proof: run unit | ✓ dateValidator > rejects a date before notBefore

**C29** - Name and client accept at most 255 characters (PROJ-06, AC 6)
Proof: run e2e | ✓ New project › limits name and client to 255 characters

**C30** - "Salvar projeto" stays disabled while any field is invalid (PROJ-06, AC 7)
Proof: run e2e | ✓ New project › keeps save disabled while any field is invalid

**C31** - The file picker accepts `.jpg,.jpeg,.png` (PROJ-06, AC 8)
Proof: run e2e | ✓ New project › file picker accepts only jpg and png

**C32** - A valid picked image replaces the drop zone with its preview (PROJ-06, AC 9)
Proof: run e2e | ✓ New project › shows the picked image as the cover preview

**C33** - A non JPEG/PNG or > 5 MB file shows "Selecione uma imagem .jpg ou .png de até 5 MB" and keeps the drop zone (PROJ-06, AC 10)
Proof: run e2e | ✓ New project › rejects a cover that is not jpg or png or is over 5 MB
Proof: run unit | ✓ coverFileValidator > rejects other types and files over 5 MB

**C34** - The trash on a picked cover brings the drop zone back (PROJ-06, AC 11)
Proof: run e2e | ✓ New project › trash discards a picked cover

**C35** - A valid submit sends multipart `POST /api/v1/projects` with the fields and cover, then shows the list and the API message (PROJ-07, AC 12)
Proof: run e2e | ✓ New project › creates the project as multipart and returns to the list with the message
Proof: run unit | ✓ apiRequest > sends FormData without a JSON content type

**C36** - While saving, "Salvar projeto" is disabled and shows its loading state (PROJ-07, AC 13)
Proof: run e2e | ✓ New project › disables save while the request is in flight

**C37** - A 422 shows each `details` message under its field and keeps the input (PROJ-07, AC 14)
Proof: run e2e | ✓ New project › shows API validation errors under their fields

**C38** - "Voltar" goes to `/projects` with no request (PROJ-06, AC 15)
Proof: run e2e | ✓ New project › Voltar returns to the list without saving

### P1: Edit a project (PROJ-08, PROJ-09)

**C39** - "..." opens Editar / Remover as in `projects-item-options.png` and closes any other card menu (PROJ-08, AC 1)
Proof: run e2e | ✓ Project card menu › opens Editar and Remover and closes other menus
Proof: browser captures/projects-item-options.running.png

**C40** - Outside click or Escape closes the card menu (PROJ-08, AC 2)
Proof: run e2e | ✓ Project card menu › closes on outside click and Escape

**C41** - "Editar" goes to `/projects/:id/edit` (PROJ-08, AC 3)
Proof: run e2e | ✓ Project card menu › Editar navigates to the edit page

**C42** - The edit page loads `GET /api/v1/projects/:id` into the form as in `edit-project.png` (PROJ-09, AC 4)
Proof: run e2e | ✓ Edit project › loads the project into the form
Proof: browser captures/edit-project.running.png

**C43** - A 404 shows the NotFound page (PROJ-09, AC 5)
Proof: run e2e | ✓ Edit project › shows the not found page for a missing project

**C44** - The trash over a saved cover removes it on save (PROJ-09, AC 6)
Proof: run e2e | ✓ Edit project › trash on a saved cover does nothing

**C45** - An unchanged past date is accepted, a date changed to the past shows "Selecione uma data válida" (PROJ-09, AC 7)
Proof: run e2e | ✓ Edit project › accepts an unchanged past date and rejects a changed one
Proof: run unit | ✓ dateValidator > skips the not-before rule when check is false

**C46** - A valid submit sends multipart `PATCH /api/v1/projects/:id`, with `cover_image` only when a file was picked, then shows the list and the message (PROJ-09, AC 8)
Proof: run e2e | ✓ Edit project › updates with PATCH multipart and returns to the list with the message
Proof: run unit | ✓ projectFormTransformer > leaves cover_image out when no file was picked

**C47** - A 422 on update shows each `details` message under its field (PROJ-09, AC 9)
Proof: run e2e | ✓ Edit project › shows API validation errors under their fields

**C48** - "Voltar" on edit goes to `/projects` with no request (PROJ-09, AC 10)
Proof: run e2e | ✓ Edit project › Voltar returns to the list without saving

### P1: Remove a project (PROJ-10)

**C49** - "Remover" opens the modal in `modal-remove-project.png` with the project's name (PROJ-10, AC 1)
Proof: run e2e | ✓ Remove project › opens the modal with the project name
Proof: browser captures/modal-remove-project.running.png

**C50** - Cancelar, backdrop and Escape close the modal with no request (PROJ-10, AC 2)
Proof: run e2e | ✓ Remove project › Cancelar, backdrop and Escape close the modal and keep the project

**C51** - Confirmar sends `DELETE`, removes the card, count −1, shows the message (PROJ-10, AC 3)
Proof: run e2e | ✓ Remove project › Confirmar deletes, removes the card, decrements the count and shows the message

**C52** - While deleting, Confirmar and Cancelar are disabled (PROJ-10, AC 4)
Proof: run e2e | ✓ Remove project › disables both buttons while the request is in flight

**C53** - A failed delete closes the modal, keeps the card and shows the error (PROJ-10, AC 5)
Proof: run e2e | ✓ Remove project › keeps the card and shows the error when delete fails

**C54** - Removing the last project shows the empty state (PROJ-10, AC 6)
Proof: run e2e | ✓ Remove project › shows the empty state after removing the last project

### P2: Search projects (PROJ-11)

**C55** - The search icon opens the focused bar with "Digite o nome do projeto ou o nome do cliente..." as in `search-bar.png` (PROJ-11, AC 1)
Proof: run e2e | ✓ Project search › opens the focused search bar with the placeholder
Proof: browser captures/search-bar.running.png

**C56** - Enter with ≥ 3 trimmed characters goes to `/projects/search?q=<term>` and saves the term (PROJ-11, AC 2)
Proof: run e2e | ✓ Project search › Enter with 3 or more characters opens the result page and saves the term

**C57** - Enter with < 3 trimmed characters sends nothing and stays (PROJ-11, AC 3)
Proof: run e2e | ✓ Project search › Enter with fewer than 3 characters does nothing

**C58** - The result page shows the term, "Voltar", "Resultado da busca" and the cards from `GET ...?search=<term>`, as in `projects-search-result.png` (PROJ-11, AC 4)
Proof: run e2e | ✓ Project search › result page lists the API results for the term
Proof: browser captures/projects-search-result.running.png

**C59** - Every case- and accent-insensitive occurrence of the term is highlighted in result names (PROJ-11, AC 5)
Proof: run e2e | ✓ Project search › highlights the term in result names
Proof: run unit | ✓ highlightSegments > marks case- and accent-insensitive matches keeping the original text

**C60** - No results shows "Nenhum projeto encontrado" (PROJ-11, AC 6)
Proof: run e2e | ✓ Project search › shows the no results message when nothing matches

**C61** - Result cards favorite, open the menu and load more on scroll (PROJ-11, AC 7)
Proof: run e2e | ✓ Project search › result cards support favorite, menu and infinite scroll

**C62** - "Voltar" on the result page goes to `/projects` (PROJ-11, AC 8)
Proof: run e2e | ✓ Project search › Voltar returns to the list

**C63** - Escape or outside click closes the search bar (PROJ-11, AC 9)
Proof: run e2e | ✓ Project search › Escape and outside click close the search bar

### P2: Recent searches (PROJ-12)

**C64** - The open bar lists up to 5 recent searches, newest first, each with history icon and X (PROJ-12, AC 1)
Proof: run e2e | ✓ Recent searches › lists up to 5 recent searches newest first

**C65** - Saving a 6th search drops the oldest (PROJ-12, AC 2)
Proof: run unit | ✓ addRecentSearch > keeps at most 5 searches, dropping the oldest

**C66** - A case-insensitive duplicate moves to the top instead of repeating (PROJ-12, AC 3)
Proof: run unit | ✓ addRecentSearch > moves a case-insensitive duplicate to the top

**C67** - Clicking a recent search runs it (PROJ-12, AC 4)
Proof: run e2e | ✓ Recent searches › clicking a recent search runs it

**C68** - X removes the search from list and storage, bar stays open (PROJ-12, AC 5)
Proof: run e2e | ✓ Recent searches › X removes the search and keeps the bar open

**C69** - Searches are stored under `projects.recentSearches.<userId>` (PROJ-12, AC 6)
Proof: run unit | ✓ useRecentSearches > stores searches under a key with the user id

**C70** - Missing or invalid stored data shows no recent searches without throwing (PROJ-12, AC 7)
Proof: run unit | ✓ readRecentSearches > returns an empty list for missing or invalid data

### Edge Cases (PROJ-13)

**C71** - A double click on "Salvar projeto" sends one request (PROJ-13, Edge 1)
Proof: run e2e | ✓ New project › sends one request on double click

**C72** - Long names and clients wrap without an ellipsis; cards in a row share the tallest height and their dividers line up (PROJ-13, Edge 2)
Proof: run e2e | ✓ Projects list › wraps long names and clients, keeping dividers aligned across a row

**C73** - After a removal, loading more pages skips no project (PROJ-13, Edge 3)
Proof: run unit | ✓ useInfiniteList > does not skip an item after a removal

**C75** - Opening `/projects/search?q=ab` or `?q=` redirects to `/projects` with no search request (PROJ-14, Edge 5)
Proof: run e2e | ✓ Project search › redirects a search shorter than 3 characters to the list

**C74** - A session that expires during the list request ends on sign-in (PROJ-13, Edge 4)
Proof: run e2e | ✓ Projects list › redirects to sign-in when the session expires during the list request

---

## Handoff

The feature's live state, written as it happens - a compaction gives no warning.

**Settled mid-build:** 2026-11-05 - asked where to commit (branch `feat/projects` or `main`) - user: "implemente sem commitar". Every task is implemented, gated and marked here, with no `git add` / `git commit`; changes stay in the working tree on `main`. Execution by 4 sequential batch sub-agents - user: "4 sub-agentes (Recommended)". 2026-11-05 - client rule (capture/spec conflict) - user: "uma palavra é pelo menos 3 caracteres", then "apenas cliente e pode ser 2 caracteres na verdade" → AD-004, Create AC 3 changed.
**Dispatched:** batch 1 (Phase 1, T1-T5) at HEAD `ebc2835` + uncommitted working tree, 2026-11-05; batch 1 returned (T1-T5 done; orchestrator fixed `ProjectAttributesApi.id` to `string` - projects use UUID keys); batch 2 (Phase 2, T6-T12) dispatched 2026-11-05; batch 2 returned (T6-T12 done, 224 unit tests); batch 3 (Phase 3, T13-T19) dispatched 2026-11-05; batch 3 returned (T13-T19 done, 224 unit / 78 e2e); batch 4 (Phases 4-6, T20-T27) dispatched 2026-11-05; batch 4 returned (T20-T27 done, 224 unit / 119 e2e + 10 opt-in screens); check_proofs round 1: 89 pass, 10 pictures not judged; Verifier + screens sub-agent round 1 dispatched 2026-11-05 over HEAD `ebc2835` + uncommitted working tree (no commits by user decision); Verifier returned (FAIL: 1 major, 4 minor) and screens round 1 returned (8 match, 2 differ); fix worker dispatched 2026-11-05; fix worker returned (8 fixes, 226 unit / 120 e2e); screens round 2 (search-bar, new-project-validations) dispatched 2026-11-05
**Walked:** 2026-11-05, by `e2e/projects/screens.spec.ts` (`CAPTURE_SCREENS=1 pnpm exec playwright test e2e/projects/screens.spec.ts`), Chromium at each capture's pixel size, pt-BR, signed in as `ptBrUser` (`e2e/support/projects.ts`), mocked API with 9 projects "Projeto 01".."Projeto 09", client Clicksign, 2024-09-01 → 2024-12-12, 01 and 07 favorited, 01 with a cover. States: empty list (list mocked empty, `/projects`); list (`/projects`); sort open (`/projects`, click "Ordenar projetos"); card menu (`/projects`, "Opções" on Projeto 01); remove modal ("Opções" on Projeto 02 → "Remover"); search bar (localStorage `projects.recentSearches.1` with 5 terms, reload, click "Buscar"); search result ("Buscar", type "Projet", Enter → `/projects/search?q=Projet`, mock returns Projeto 01); new project (`/projects` → "Novo projeto"); validations (type "Iridium" in name and client, 2000-01-01 in both dates, blur); edit (`/projects` → "Opções" on Projeto 01 → "Editar", `GET /projects/1` returns "Projeto Iridium"). No dev database: the walk runs against the mocked API.

---

## Phase Execution Map

Phases run in sequence; tasks within a phase run in order (T1 … T27). Each phase's own edges are drawn
under Execution Plan; the edges that cross phases are:

```
T1 → T11
T4 → T13
T5 → T13
T11 → T15
T12 → T16
T12 → T19
T19 → T20
T13 → T21
T10 → T21
T12 → T21
T7 → T23
T13 → T23
T22 → T27
T26 → T27
```

27 tasks pack into 4 batches of whole phases (Phases 1-2 = 12 tasks is over budget, so: Phase 1 + Phase 2 as two batches of 5 and 7, Phase 3 = 7, Phases 4-6 = 8). The sub-agent offer comes before T1.
