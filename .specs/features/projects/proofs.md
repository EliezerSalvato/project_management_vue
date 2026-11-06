# projects proofs

**HEAD**: ebc2835
**Tree**: dirty - e2e/apiFailures.spec.ts, e2e/login.spec.ts, e2e/session.spec.ts, e2e/support/fixtures.ts, index.html
**Shell**: /bin/sh
**Result**: 99 pass, 1 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `run e2e / ✓ Projects list › shows the empty state when the user has no projects` | pass |
| C1 | `browser captures/projects-empty-list.running.png` | pass |
| C2 | `run e2e / ✓ Projects list › shows one card per project with name, client and dates` | pass |
| C2 | `run unit / ✓ formatLongDate > formats pt-BR as 01 de setembro de 2024` | pass |
| C2 | `browser captures/projects-list.running.png` | pass |
| C3 | `run e2e / ✓ Projects list › shows the total count from the API next to the title` | pass |
| C4 | `run e2e / ✓ Projects list › shows the placeholder when a project has no cover` | pass |
| C5 | `run e2e / ✓ Projects list › navigates to the new project page from the empty state and the header button` | pass |
| C6 | `run e2e / ✓ Projects infinite scroll › loads and appends the next page at the end of the grid` | pass |
| C6 | `run unit / ✓ useInfiniteList > appends the next page after the loaded items` | pass |
| C7 | `run e2e / ✓ Projects infinite scroll › shows the loading indicator while the next page loads` | pass |
| C7 | `run unit / ✓ useInfiniteList > ignores loadMore while a page is loading` | pass |
| C8 | `run e2e / ✓ Projects infinite scroll › stops requesting after the last page` | pass |
| C8 | `run unit / ✓ useInfiniteList > makes no request after the last page` | pass |
| C9 | `run e2e / ✓ Projects list › shows the API error when the list fails` | pass |
| C10 | `run e2e / ✓ Projects list › redirects a signed-out user from every projects route to sign-in` | pass |
| C11 | `run e2e / ✓ Projects list › redirects the root path to the projects list` | pass |
| C12 | `run e2e / ✓ Projects list › shows only the logo and the search icon in the header` | pass |
| C13 | `run e2e / ✓ Projects list › logo navigates to the projects list` | pass |
| C14 | `run e2e / ✓ Projects sort › lists the three sort options` | pass |
| C14 | `browser captures/projects-select-order.running.png` | pass |
| C15 | `run e2e / ✓ Projects sort › reloads from page 1 with the picked sort and closes the select` | pass |
| C16 | `run e2e / ✓ Projects sort › uses name when the URL has no valid sort` | pass |
| C17 | `run e2e / ✓ Projects sort › keeps the sort from the URL after reload` | pass |
| C18 | `run e2e / ✓ Projects sort › closes on outside click and Escape without changing the order` | pass |
| C18 | `run unit / ✓ useClickOutside > calls the handler on an outside click and on Escape` | pass |
| C19 | `run e2e / ✓ Project favorite › favorites a project with POST and fills the star` | pass |
| C20 | `run e2e / ✓ Project favorite › unfavorites a project with DELETE and empties the star` | pass |
| C21 | `run e2e / ✓ Project favorite › keeps the star and shows the error when the request fails` | pass |
| C22 | `run e2e / ✓ Project favorite › ignores clicks while the request is in flight` | pass |
| C23 | `run e2e / ✓ Projects list › favorites toggle stays off and does not change the list` | pass |
| C24 | `run e2e / ✓ New project › shows the empty form with the save button disabled` | pass |
| C24 | `browser captures/new-project.running.png` | pass |
| C25 | `run e2e / ✓ New project › shows the two-words error on the name after blur` | pass |
| C25 | `run unit / ✓ minWordsValidator > rejects fewer words than the minimum after trimming` | pass |
| C25 | `browser captures/new-project-validations.running.png` | pass |
| C26 | `run e2e / ✓ New project › shows the one-word error on a blank client after blur` | pass |
| C27 | `run e2e / ✓ New project › shows the date error on a start date before today` | pass |
| C27 | `run unit / ✓ dateValidator > rejects empty, malformed and past dates` | pass |
| C28 | `run e2e / ✓ New project › shows the date error on an end date before the start date` | pass |
| C28 | `run unit / ✓ dateValidator > rejects a date before notBefore` | pass |
| C29 | `run e2e / ✓ New project › limits name and client to 255 characters` | pass |
| C30 | `run e2e / ✓ New project › keeps save disabled while any field is invalid` | pass |
| C31 | `run e2e / ✓ New project › file picker accepts only jpg and png` | pass |
| C32 | `run e2e / ✓ New project › shows the picked image as the cover preview` | pass |
| C33 | `run e2e / ✓ New project › rejects a cover that is not jpg or png or is over 5 MB` | pass |
| C33 | `run unit / ✓ coverFileValidator > rejects other types and files over 5 MB` | pass |
| C34 | `run e2e / ✓ New project › trash discards a picked cover` | pass |
| C35 | `run e2e / ✓ New project › creates the project as multipart and returns to the list with the message` | pass |
| C35 | `run unit / ✓ apiRequest > sends FormData without a JSON content type` | pass |
| C36 | `run e2e / ✓ New project › disables save while the request is in flight` | pass |
| C37 | `run e2e / ✓ New project › shows API validation errors under their fields` | pass |
| C38 | `run e2e / ✓ New project › Voltar returns to the list without saving` | pass |
| C39 | `run e2e / ✓ Project card menu › opens Editar and Remover and closes other menus` | pass |
| C39 | `browser captures/projects-item-options.running.png` | pass |
| C40 | `run e2e / ✓ Project card menu › closes on outside click and Escape` | pass |
| C41 | `run e2e / ✓ Project card menu › Editar navigates to the edit page` | pass |
| C42 | `run e2e / ✓ Edit project › loads the project into the form` | pass |
| C42 | `browser captures/edit-project.running.png` | pass |
| C43 | `run e2e / ✓ Edit project › shows the not found page for a missing project` | pass |
| C44 | `run e2e / ✓ Edit project › trash on a saved cover does nothing` | pass |
| C45 | `run e2e / ✓ Edit project › accepts an unchanged past date and rejects a changed one` | pass |
| C45 | `run unit / ✓ dateValidator > skips the not-before rule when check is false` | pass |
| C46 | `run e2e / ✓ Edit project › updates with PATCH multipart and returns to the list with the message` | pass |
| C46 | `run unit / ✓ projectFormTransformer > leaves cover_image out when no file was picked` | pass |
| C47 | `run e2e / ✓ Edit project › shows API validation errors under their fields` | pass |
| C48 | `run e2e / ✓ Edit project › Voltar returns to the list without saving` | pass |
| C49 | `run e2e / ✓ Remove project › opens the modal with the project name` | pass |
| C49 | `browser captures/modal-remove-project.running.png` | pass |
| C50 | `run e2e / ✓ Remove project › Cancelar, backdrop and Escape close the modal and keep the project` | pass |
| C51 | `run e2e / ✓ Remove project › Confirmar deletes, removes the card, decrements the count and shows the message` | pass |
| C52 | `run e2e / ✓ Remove project › disables both buttons while the request is in flight` | pass |
| C53 | `run e2e / ✓ Remove project › keeps the card and shows the error when delete fails` | pass |
| C54 | `run e2e / ✓ Remove project › shows the empty state after removing the last project` | pass |
| C55 | `run e2e / ✓ Project search › opens the focused search bar with the placeholder` | pass |
| C55 | `browser captures/search-bar.running.png` | **diverges** (screens.md) |
| C56 | `run e2e / ✓ Project search › Enter with 3 or more characters opens the result page and saves the term` | pass |
| C57 | `run e2e / ✓ Project search › Enter with fewer than 3 characters does nothing` | pass |
| C58 | `run e2e / ✓ Project search › result page lists the API results for the term` | pass |
| C58 | `browser captures/projects-search-result.running.png` | pass |
| C59 | `run e2e / ✓ Project search › highlights the term in result names` | pass |
| C59 | `run unit / ✓ highlightSegments > marks case- and accent-insensitive matches keeping the original text` | pass |
| C60 | `run e2e / ✓ Project search › shows the no results message when nothing matches` | pass |
| C61 | `run e2e / ✓ Project search › result cards support favorite, menu and infinite scroll` | pass |
| C62 | `run e2e / ✓ Project search › Voltar returns to the list` | pass |
| C63 | `run e2e / ✓ Project search › Escape and outside click close the search bar` | pass |
| C64 | `run e2e / ✓ Recent searches › lists up to 5 recent searches newest first` | pass |
| C65 | `run unit / ✓ addRecentSearch > keeps at most 5 searches, dropping the oldest` | pass |
| C66 | `run unit / ✓ addRecentSearch > moves a case-insensitive duplicate to the top` | pass |
| C67 | `run e2e / ✓ Recent searches › clicking a recent search runs it` | pass |
| C68 | `run e2e / ✓ Recent searches › X removes the search and keeps the bar open` | pass |
| C69 | `run unit / ✓ useRecentSearches > stores searches under a key with the user id` | pass |
| C70 | `run unit / ✓ readRecentSearches > returns an empty list for missing or invalid data` | pass |
| C71 | `run e2e / ✓ New project › sends one request on double click` | pass |
| C72 | `run e2e / ✓ Projects list › wraps long names and clients, keeping dividers aligned across a row` | pass (re-run 2026-11-06 after Edge 2 changed to wrapping) |
| C73 | `run unit / ✓ useInfiniteList > does not skip an item after a removal` | pass |
| C75 | `run e2e / ✓ Project search › redirects a search shorter than 3 characters to the list` | pass |
| C74 | `run e2e / ✓ Projects list › redirects to sign-in when the session expires during the list request` | pass |
| Build | `pnpm build` | pass |
| Build | `pnpm lint` | pass |

## Output

`Run e2e` - exit 0

```
  ✓  65 [chromium] › e2e/projects/search.spec.ts:79:3 › Project search › Enter with fewer than 3 characters does nothing (2.2s)
  ✓  71 [chromium] › e2e/projects/search.spec.ts:186:3 › Project search › result cards support favorite, menu and infinite scroll (2.2s)
  ✓  72 [chromium] › e2e/projects/search.spec.ts:224:3 › Project search › Voltar returns to the list (2.1s)
  ✓  76 [chromium] › e2e/projects/sort.spec.ts:49:3 › Projects sort › lists the three sort options (1.8s)
  ✓  77 [chromium] › e2e/projects/sort.spec.ts:63:3 › Projects sort › reloads from page 1 with the picked sort and closes the select (1.9s)
  ✓  73 [chromium] › e2e/projects/search.spec.ts:242:3 › Recent searches › lists up to 5 recent searches newest first (3.3s)
  ✓  75 [chromium] › e2e/projects/search.spec.ts:293:3 › Recent searches › X removes the search and keeps the bar open (2.9s)
  ✓  74 [chromium] › e2e/projects/search.spec.ts:283:3 › Recent searches › clicking a recent search runs it (3.1s)
  ✓  78 [chromium] › e2e/projects/sort.spec.ts:84:3 › Projects sort › uses name when the URL has no valid sort (2.2s)
  ✓  80 [chromium] › e2e/projects/sort.spec.ts:108:3 › Projects sort › closes on outside click and Escape without changing the order (1.6s)
  ✓  79 [chromium] › e2e/projects/sort.spec.ts:94:3 › Projects sort › keeps the sort from the URL after reload (2.5s)
  ✓  68 [chromium] › e2e/projects/search.spec.ts:138:3 › Project search › redirects a search shorter than 3 characters to the list (6.0s)

  10 skipped
  70 passed (26.9s)
```

`Run unit` - exit 0

```
 ✓ src/utils/__tests__/safeRedirect.spec.ts > safeRedirectPath > rejects empty string 0ms
 ✓ src/utils/__tests__/safeRedirect.spec.ts > safeRedirectPath > rejects non-string value undefined 0ms
 ✓ src/utils/__tests__/safeRedirect.spec.ts > safeRedirectPath > rejects non-string value null 0ms
 ✓ src/utils/__tests__/safeRedirect.spec.ts > safeRedirectPath > rejects non-string value 42 0ms
 ✓ src/utils/__tests__/safeRedirect.spec.ts > safeRedirectPath > rejects non-string value "/a" 0ms
 ✓ src/utils/__tests__/safeRedirect.spec.ts > safeRedirectPath > uses the given fallback 0ms

 Test Files  20 passed (20)
      Tests  226 passed (226)
   Start at  20:42:28
   Duration  3.71s (environment 91%, import 5%, transform 2%, tests 2%, worker 1%)

Environment  jsdom was created 20 times · 36.15s total, 91% of tracked time
             create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
             learn more: https://vitest.dev/guide/improving-performance#test-environments
```
