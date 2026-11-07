# Projects verification

**Verdict**: FAIL
**Proofs**: `proofs.md` at ebc2835 (working tree, uncommitted)
**Verifier**: independent sub-agent (author != verifier)

The edit form accepts an end date before the start date when only the start was changed, and no test catches it. Four smaller findings follow. Both suites are green at the working tree: vitest 224/224, `e2e/projects` 69 passed and 10 skipped (screens, opt-in).

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | `list.spec.ts` `shows the empty state when the user has no projects` | yes |
| C2 | `list.spec.ts` `shows one card per project with name, client and dates`; `date.spec.ts` `formats pt-BR as 01 de setembro de 2024` | yes |
| C3 | `list.spec.ts` `shows the total count from the API next to the title` | yes: 20 cards loaded, "(25)" asserted |
| C4 | `list.spec.ts` `shows the placeholder when a project has no cover` | yes: placeholder, purple background and the cover case |
| C5 | `list.spec.ts` `navigates to the new project page from the empty state and the header button` | yes |
| C6 | `infiniteScroll.spec.ts` `loads and appends the next page at the end of the grid`; `useInfiniteList.spec.ts` `appends the next page after the loaded items` | yes: the full name order is asserted |
| C7 | `infiniteScroll.spec.ts` `shows the loading indicator while the next page loads`; `useInfiniteList.spec.ts` `ignores loadMore while a page is loading` | partly: the unit test holds the no-double-request rule. The e2e position assertion is racy (2/30 failures), and the e2e "not twice" count is read right after the wheel without waiting |
| C8 | `infiniteScroll.spec.ts` `stops requesting after the last page`; `useInfiniteList.spec.ts` `makes no request after the last page` | yes |
| C9 | `list.spec.ts` `shows the API error when the list fails` | yes |
| C10 | `list.spec.ts` `redirects a signed-out user from every projects route to sign-in` | yes: all four routes, exact `redirect` |
| C11 | `list.spec.ts` `redirects the root path to the projects list` | yes |
| C12 | `list.spec.ts` `shows only the logo and the search icon in the header` | partly: asserted on the list page only. AC 12 covers every project page, and New/Edit headers are never checked |
| C13 | `list.spec.ts` `logo navigates to the projects list` | yes: starts on `?sort=recent_start`, so a dead link would fail |
| C14 | `sort.spec.ts` `lists the three sort options` | yes |
| C15 | `sort.spec.ts` `reloads from page 1 with the picked sort and closes the select` | yes: all three values, page 1, one request each |
| C16 | `sort.spec.ts` `uses name when the URL has no valid sort` | yes: missing and invalid |
| C17 | `sort.spec.ts` `keeps the sort from the URL after reload` | yes |
| C18 | `sort.spec.ts` `closes on outside click and Escape without changing the order`; `useClickOutside.spec.ts` | yes |
| C19 | `favorite.spec.ts` `favorites a project with POST and fills the star` | yes |
| C20 | `favorite.spec.ts` `unfavorites a project with DELETE and empties the star` | yes |
| C21 | `favorite.spec.ts` `keeps the star and shows the error when the request fails` | yes |
| C22 | `favorite.spec.ts` `ignores clicks while the request is in flight` | yes |
| C23 | `list.spec.ts` `favorites toggle stays off and does not change the list` | yes |
| C24 | `newProject.spec.ts` `shows the empty form with the save button disabled` | yes |
| C25 | `newProject.spec.ts` `shows the two-words error on the name after blur`; `validators.spec.ts` `rejects fewer words than the minimum after trimming` | yes: hidden before blur, shown after |
| C26 | `newProject.spec.ts` `shows the one-word error on a blank client after blur` | yes |
| C27 | `newProject.spec.ts` `shows the date error on a start date before today`; `validators.spec.ts` `rejects empty, malformed and past dates` | yes: empty, yesterday, today accepted |
| C28 | `newProject.spec.ts` `shows the date error on an end date before the start date`; `validators.spec.ts` `rejects a date before notBefore` | yes for the create form; the edit form breaks the same rule (see Findings) |
| C29 | `newProject.spec.ts` `limits name and client to 255 characters` | yes |
| C30 | `newProject.spec.ts` `keeps save disabled while any field is invalid` | yes: each field in turn |
| C31 | `newProject.spec.ts` `file picker accepts only jpg and png` | yes |
| C32 | `newProject.spec.ts` `shows the picked image as the cover preview` | yes |
| C33 | `newProject.spec.ts` `rejects a cover that is not jpg or png or is over 5 MB`; `validators.spec.ts` `rejects other types and files over 5 MB` | yes: the unit test covers the boundary (5 MB accepted, 5 MB + 1 rejected) |
| C34 | `newProject.spec.ts` `trash discards a picked cover` | yes |
| C35 | `newProject.spec.ts` `creates the project as multipart and returns to the list with the message`; `client.spec.ts` `sends FormData without a JSON content type` | yes |
| C36 | `newProject.spec.ts` `disables save while the request is in flight` | yes |
| C37 | `newProject.spec.ts` `shows API validation errors under their fields` | yes |
| C38 | `newProject.spec.ts` `Voltar returns to the list without saving` | yes |
| C39 | `cardMenu.spec.ts` `opens Editar and Remover and closes other menus` | yes |
| C40 | `cardMenu.spec.ts` `closes on outside click and Escape` | yes |
| C41 | `cardMenu.spec.ts` `Editar navigates to the edit page` | yes |
| C42 | `editProject.spec.ts` `loads the project into the form` | yes |
| C43 | `editProject.spec.ts` `shows the not found page for a missing project` | yes |
| C44 | `editProject.spec.ts` `trash on a saved cover removes it on save` | yes |
| C45 | `editProject.spec.ts` `accepts an unchanged past date and rejects a changed one`; `validators.spec.ts` `skips the not-before rule when check is false` | no: covers the start date only. AC 7 brings criteria 2-11 to edit, and no test exercises the edit end date. Moving the start past an unchanged end passes (see Findings) |
| C46 | `editProject.spec.ts` `updates with PATCH multipart and returns to the list with the message`; `project.spec.ts` `leaves cover_image out when no file was picked` | yes: the unit test also asserts the picked-file case |
| C47 | `editProject.spec.ts` `shows API validation errors under their fields` | yes |
| C48 | `editProject.spec.ts` `Voltar returns to the list without saving` | yes |
| C49 | `remove.spec.ts` `opens the modal with the project name` | yes |
| C50 | `remove.spec.ts` `Cancelar, backdrop and Escape close the modal and keep the project` | yes |
| C51 | `remove.spec.ts` `Confirmar deletes, removes the card, decrements the count and shows the message` | yes |
| C52 | `remove.spec.ts` `disables both buttons while the request is in flight` | yes |
| C53 | `remove.spec.ts` `keeps the card and shows the error when delete fails` | yes |
| C54 | `remove.spec.ts` `shows the empty state after removing the last project` | yes |
| C55 | `search.spec.ts` `opens the focused search bar with the placeholder` | yes |
| C56 | `search.spec.ts` `Enter with 3 or more characters opens the result page and saves the term` | yes: trimmed term in URL and storage |
| C57 | `search.spec.ts` `Enter with fewer than 3 characters does nothing` | yes |
| C58 | `search.spec.ts` `result page lists the API results for the term` | yes |
| C59 | `search.spec.ts` `highlights the term in result names`; `highlight.spec.ts` `marks case- and accent-insensitive matches keeping the original text` | yes |
| C60 | `search.spec.ts` `shows the no results message when nothing matches` | yes |
| C61 | `search.spec.ts` `result cards support favorite, menu and infinite scroll` | yes |
| C62 | `search.spec.ts` `Voltar returns to the list` | yes |
| C63 | `search.spec.ts` `Escape and outside click close the search bar` | yes |
| C64 | `search.spec.ts` `lists up to 5 recent searches newest first` | no: seeds exactly 5, so "up to 5" is never tested. With 7 stored the bar shows 7 |
| C65 | `recentSearches.spec.ts` `keeps at most 5 searches, dropping the oldest` | yes |
| C66 | `recentSearches.spec.ts` `moves a case-insensitive duplicate to the top` | yes |
| C67 | `search.spec.ts` `clicking a recent search runs it` | yes |
| C68 | `search.spec.ts` `X removes the search and keeps the bar open` | yes |
| C69 | `useRecentSearches.spec.ts` `stores searches under a key with the user id` | yes |
| C70 | `recentSearches.spec.ts` `returns an empty list for missing or invalid data` | yes: six malformed values |
| C71 | `newProject.spec.ts` `sends one request on double click` | yes |
| C72 | `list.spec.ts` `wraps long names and clients, keeping dividers aligned across a row` | not re-verified: Edge 2 changed to wrapping on 2026-11-06; the earlier verdict covered the ellipsis behavior |
| C73 | `useInfiniteList.spec.ts` `does not skip an item after a removal` | yes: a fake offset API shifts the rows. My own e2e probe (25 rows, 3 removed, then scroll) also loaded all 22 |
| C74 | `list.spec.ts` `redirects to sign-in when the session expires during the list request` | yes |
| C75 | `search.spec.ts` `redirects a search shorter than 3 characters to the list` | yes, judged by the orchestrator after the fix pass (no second Verifier by design): covers `?q=ab`, `?q=%20ab%20`, `?q=` and no `q`, and asserts no `GET /api/v1/projects` carries `search` |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| Major: the edit form accepts an end date before the start date when only the start changed (violates Create AC 5 via Edit AC 7) | `ProjectForm.vue:68`: `check: isChanged('endDate')` turns off both "not before today" and "not before start" for an unchanged end. Probe: project start +1d, end +5d; change start to +10d, then blur. The end shows no error and "Salvar projeto" stays enabled | Apply only "not before today" under `isChanged`. Always check end >= start. Add an edit e2e for the end date | fixed, uncommitted (user: "implemente sem commitar") - `ProjectForm.vue:55-68`; proven by C45 `editProject.spec.ts:114` |
| Minor: the search bar shows every stored recent search, not at most 5 (Recent AC 1) | `SearchBar.vue:86` iterates `searches` unsliced, and `readRecentSearches` returns any length. Probe: 7 strings stored under the user key, then open the bar: 7 items. C64 seeds exactly 5 | Cap the list at `MAX_RECENT_SEARCHES` on read or render. Seed more than 5 in C64 | fixed, uncommitted - `recentSearches.ts:11` caps reads at 5; unit `readRecentSearches > returns at most 5 searches, newest first`, C64 seeds 7 |
| Minor: the C7 e2e is racy, not the code. It failed 2 of 30 runs here | `infiniteScroll.spec.ts:63-67` measures the grid bottom and the loading top in two separate `evaluate` calls while the wheel scroll is still settling. A probe logged `scrollY` 2773, then 2816 on the next call. Read in one frame, the indicator is always 10 px below the grid (40/40 runs) | Read both rects in one `evaluate`, or wait for the scroll to settle. Also wait (e.g. `waitForTimeout`) before the "page 2 requested once" count at line 71, which today runs right after the wheel | fixed, uncommitted - `infiniteScroll.spec.ts:63-77` single-frame read + poll; 20/20 with `--repeat-each=20` |
| Minor: the result page searches with any `q`, so the 3-character rule lives only in the search bar | `Search.vue:20` calls `listProjects({ search: term })` without a length check. Opening `/projects/search?q=ab` (or `?q=`) sends the request the API rejects, or lists every project under "Resultado da busca". No check covers it | Skip the request (or show "Nenhum projeto encontrado") when the trimmed `q` is under 3 characters, and add an e2e | fixed, uncommitted - `Search.vue:19-23,52-60` redirects short `q`; new PROJ-14 / C75 |
| Minor: the header rule (AC 12) is proven only on the list page | `list.spec.ts:56` checks `/projects` only. The New and Edit headers (logo, no search icon, no other controls) are never asserted | Assert the header on `/projects/new` and `/projects/:id/edit` | fixed, uncommitted - C12 `list.spec.ts:72` also asserts `/projects/new` and `/projects/7/edit` |
