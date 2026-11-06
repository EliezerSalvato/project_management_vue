# Projects screens

**Verifier**: independent sub-agent (author != verifier)
**Round**: 2
**Pictures**: retaken by the verifier on 2026-11-05 with `CAPTURE_SCREENS=1 pnpm exec playwright test e2e/projects/screens.spec.ts` (Chromium, pt-BR, viewport = capture pixel size, mocked API, states as in the `**Walked:**` line). 10 of 10 passed.
**Round 2**: on 2026-11-05 the verifier retook all pictures with the same command (10 of 10 passed) and re-opened only the `differs` rows of `search-bar` and `new-project-validations`. Every other row stands as judged in round 1.

Every capture carries a 3-4 px dark frame on its left and right edges, so its content starts at x=4. That frame is how the captures were taken, not something the page draws. It is not judged on any picture.

| Screen                                         | Compared with                          | Verdict  | Finding                                                                                         |
| ---------------------------------------------- | -------------------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `captures/projects-empty-list.running.png`     | `captures/projects-empty-list.png`     | matches  |                                                                                                 |
| `captures/projects-list.running.png`           | `captures/projects-list.png`           | matches  |                                                                                                 |
| `captures/projects-select-order.running.png`   | `captures/projects-select-order.png`   | matches  |                                                                                                 |
| `captures/projects-item-options.running.png`   | `captures/projects-item-options.png`   | matches  |                                                                                                 |
| `captures/modal-remove-project.running.png`    | `captures/modal-remove-project.png`    | matches  | backdrop blur lighter (note)                                                                    |
| `captures/search-bar.running.png`              | `captures/search-bar.png`              | diverges | round 2: 1 row still differs: bar outline has no top edge (sides, bottom and corners now match) |
| `captures/projects-search-result.running.png`  | `captures/projects-search-result.png`  | matches  | top bar icon and term sit further left (note)                                                   |
| `captures/new-project.running.png`             | `captures/new-project.png`             | matches  |                                                                                                 |
| `captures/new-project-validations.running.png` | `captures/new-project-validations.png` | matches  | round 2: client row is an approved difference (AD-004)                                          |
| `captures/edit-project.running.png`            | `captures/edit-project.png`            | matches  |                                                                                                 |

`projects-list-favorites.png` has no picture: deferred by AD-001.

### `captures/projects-empty-list.running.png`

| Element                                                                      | Result | Picture draws                                       |
| ---------------------------------------------------------------------------- | ------ | --------------------------------------------------- |
| header: dark bar 80 px, logo + "Gerenciador de Projetos" centered            | same   | Note: logo group sits ~13 px left of the capture's. |
| header: search icon on the right, no other controls                          | same   |                                                     |
| page: lavender background, white panel with margins on all sides             | same   |                                                     |
| panel: content centered vertically and horizontally                          | same   |                                                     |
| title "Nenhum projeto", bold, dark purple                                    | same   |                                                     |
| sentence "Clique no botão abaixo para criar o primeiro e gerenciá-lo.", grey | same   |                                                     |
| button "Novo projeto": purple pill, plus-circle icon left of label           | same   | Note: icon-to-label gap ~10 px narrower.            |

### `captures/projects-list.running.png`

| Element                                                                                                                                            | Result | Picture draws                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| header: logo centered, search icon right                                                                                                           | same   |                                                                                                                   |
| toolbar left: "Projetos" bold purple + "(9)" lighter                                                                                               | same   |                                                                                                                   |
| toolbar right, in order: toggle off + "Apenas Favoritos", sort select "Ordem alfabética" with chevron, purple pill "Novo projeto" with plus-circle | same   |                                                                                                                   |
| grid: 5 cards per row, second row of 4 left aligned, bottom row cut by the window                                                                  | same   |                                                                                                                   |
| card top: cover area 230 px, purple placeholder with yellow stacked-frames icon when no cover                                                      | same   | Note: placeholder icon is redrawn (`cover-placeholder.svg`, not in `design/icons`); shape, colors and size match. |
| card top: cover image filling the area on the project with a cover                                                                                 | same   | Sample artwork differs (logo used as cover); not judged.                                                          |
| card top: star (filled orange on 01 and 07, outline white elsewhere) and white round "..." button, bottom right                                    | same   |                                                                                                                   |
| card body: name bold dark purple, "Cliente:" bold grey + client name                                                                               | same   |                                                                                                                   |
| card body: divider, then start date with calendar-day icon and end date with calendar-check icon                                                   | same   | Note: end-date icon redrawn (`calendar-check-light.svg`); matches the capture's drawing.                          |
| card: white, rounded, light border                                                                                                                 | same   |                                                                                                                   |

### `captures/projects-select-order.running.png`

| Element                                                                                                      | Result | Picture draws |
| ------------------------------------------------------------------------------------------------------------ | ------ | ------------- |
| list page behind, unchanged (header, toolbar, grid)                                                          | same   |               |
| select trigger: purple border, "Ordem alfabética", chevron pointing up                                       | same   |               |
| open list: attached under the trigger, same width, white with shadow, overlapping the cards                  | same   |               |
| options in order: "Ordem alfabética", "Iniciados mais recentes", "Prazo mais próximo", divided by thin lines | same   |               |

### `captures/projects-item-options.running.png`

| Element                                                                                                                 | Result | Picture draws                                                          |
| ----------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| list page behind, unchanged                                                                                             | same   |                                                                        |
| menu: white box with shadow under the card's "..." button, right edge aligned to it, small notch pointing at the button | same   | Opened on Projeto 01 instead of Projeto 02; which card is sample data. |
| menu: covers the card's name and client                                                                                 | same   |                                                                        |
| item "Editar" with pencil icon, purple                                                                                  | same   |                                                                        |
| divider, then item "Remover" with trash icon, purple                                                                    | same   |                                                                        |

### `captures/modal-remove-project.running.png`

| Element                                                                                | Result | Picture draws                                                                                                                          |
| -------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| backdrop: whole page, header included, dimmed and blurred                              | same   | Note: blur is lighter (`backdrop-filter: blur(2px)`); the capture's page behind is illegible, the picture's card labels stay readable. |
| modal: white box centered horizontally, upper half of the window                       | same   |                                                                                                                                        |
| round purple badge with trash icon straddling the modal's top edge                     | same   |                                                                                                                                        |
| title "Remover projeto", bold dark purple, centered                                    | same   |                                                                                                                                        |
| divider line under the title                                                           | same   |                                                                                                                                        |
| sentence "Essa ação removerá definitivamente o projeto:", grey, centered               | same   |                                                                                                                                        |
| project name, large dark text, centered                                                | same   | Shows "Projeto 02" where the capture shows "Nome do projeto"; the criterion asks for the project's name.                               |
| buttons on one row: "Cancelar" outline pill left, "Confirmar" filled purple pill right | same   |                                                                                                                                        |

### `captures/search-bar.running.png`

| Element                                                                                           | Result  | Picture draws                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| search bar replaces the whole header, full width, white                                           | same    |                                                                                                                                                                                                                                                                                                       |
| field: purple search icon left, placeholder "Digite o nome do projeto ou o nome do cliente..." grey                    | same    |                                                                                                                                                                                                                                                                                                       |
| bar outline: purple line closing the field and the recent list on all four sides, rounded corners | differs | Round 2: sides and bottom are now 2 px purple and both top corners are rounded, but the top edge is still not drawn: row 0 between the corners is white (x=8..1940), and the corner arcs run up out of the window, as if the bar sits ~2 px above the viewport top. The bar is still open at the top. |
| recent list: 5 rows under the field, separated by thin lines                                      | same    |                                                                                                                                                                                                                                                                                                       |
| each row: history icon left, term, "X" at the far right                                           | same    | Terms are "Projeto 1".."Projeto 5" where the capture repeats "Projeto 1"; sample data, not judged. Note: rows are #fafafa with dark text where the capture has white rows with grey text.                                                                                                             |
| list page behind, partly covered by the bar                                                       | same    |                                                                                                                                                                                                                                                                                                       |

### `captures/projects-search-result.running.png`

| Element                                                                             | Result | Picture draws                                                                                                          |
| ----------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| top bar: white, full width, purple search icon and the term "Projet", no logo       | same   | Note: icon starts at x≈24 and term at x≈61; capture has x≈36 and x≈78 (after its 4 px frame, ~10-13 px further right). |
| "Voltar" link with left arrow, purple                                               | same   |                                                                                                                        |
| title "Resultado da busca", bold dark purple                                        | same   |                                                                                                                        |
| one card, same drawing as the list cards, at the left of the grid                   | same   |                                                                                                                        |
| name highlight: "Projet" on an orange background in white, rest of name dark purple | same   |                                                                                                                        |

### `captures/new-project.running.png`

| Element                                                                                                                                     | Result | Picture draws |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------- |
| header: logo centered, no search icon                                                                                                       | same   |               |
| "Voltar" link with left arrow                                                                                                               | same   |               |
| title "Novo projeto"                                                                                                                        | same   |               |
| white panel with light border, form centered in a ~700 px column                                                                            | same   |               |
| "Nome do projeto" purple label + "(Obrigatório)" grey, full-width input                                                                     | same   |               |
| "Cliente" label + "(Obrigatório)", full-width input                                                                                         | same   |               |
| "Data de Início" and "Data Final" on one row, each with "(Obrigatório)", calendar-day and calendar-check icons inside on the right          | same   |               |
| "Capa do projeto" label, dashed drop zone with upload icon, "Escolha uma imagem .jpg ou .png no seu dispositivo", outline pill "Selecionar" | same   |               |
| "Salvar projeto": full-width pill, light purple (disabled)                                                                                  | same   |               |

### `captures/new-project-validations.running.png`

| Element                                                                                                                  | Result | Picture draws                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| page frame, "Voltar", "Novo projeto", panel                                                                              | same   |                                                                                                                                                                                                                                                                                                                                                     |
| name: label and "(Obrigatório)" red, red border, value "Iridium", red message "Por favor, digite ao menos duas palavras" | same   |                                                                                                                                                                                                                                                                                                                                                     |
| client: label and "(Obrigatório)" red, red border, value "Iridium", red message "Por favor, digite ao menos uma palavra" | same   | Round 2: approved difference AD-004 (`## Differences from the source`, spec Create 3): a client with one word of 2+ characters is valid, so "Iridium" draws the normal state (purple label, grey "(Obrigatório)", grey border, no message). Dates, cover and button sit ~26 px higher because the message line is absent; that follows from AD-004. |
| start and end dates: labels red, red borders, red icons, "01/01/2000", red "Selecione uma data válida" under each        | same   |                                                                                                                                                                                                                                                                                                                                                     |
| "Capa do projeto" drop zone unchanged                                                                                    | same   |                                                                                                                                                                                                                                                                                                                                                     |
| "Salvar projeto" disabled                                                                                                | same   |                                                                                                                                                                                                                                                                                                                                                     |

### `captures/edit-project.running.png`

| Element                                                                  | Result | Picture draws                                                                                                                                                                      |
| ------------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| header, "Voltar", title "Editar projeto", panel                          | same   |                                                                                                                                                                                    |
| name, client, start and end inputs filled, normal state                  | same   | Name is "Projeto Iridium" where the capture shows "Iridium": a one-word name fails spec Create 2 and would disable save, which the capture draws enabled. Sample data; not judged. |
| dates "01/12/2025" and "02/12/2025" with their icons                     | same   |                                                                                                                                                                                    |
| "Capa do projeto": saved cover filling the zone (~700x395), no drop zone | same   | Sample artwork differs (transparent logo used as the cover); not judged.                                                                                                           |
| white round trash button, top right over the cover                       | same   | AD-002: shown, does nothing.                                                                                                                                                       |
| "Salvar projeto": full-width pill, solid purple (enabled)                | same   |                                                                                                                                                                                    |
