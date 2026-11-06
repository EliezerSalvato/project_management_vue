# STATE

## Decisions

### AD-001 (superseded)

- **Decision**: The "Apenas Favoritos" toggle on the projects list is rendered but has no action until the API supports a favorite filter on `GET /api/v1/projects`.
- **Reason**: The API lists projects only by `search` and `sort`; `favorites_controller` only marks/unmarks. Asked: "Para o toggle 'Apenas Favoritos' (com scroll infinito), qual caminho?" - user: "deixe sem ação, eu vou implementar na api depois".
- **Trade-off**: The filtered state drawn in `projects-list-favorites.png` is not reachable in this feature.
- **Scope**: projects feature - list page
- **Date**: 2026-11-05
- **Status**: superseded 2026-11-06 - the API now accepts `favorite=true` on `GET /api/v1/projects`; the toggle filters the list (state in the URL as `?favorite=true`).

### AD-002 (active)

- **Decision**: The trash icon over a saved cover image on the edit page has no action until the API supports removing a cover.
- **Reason**: `Project::Update` can replace a cover but never remove one. Asked: "O que a lixeira faz?" - user: "deixe o icone sem fazer nada, depois eu vou implementar na api".
- **Trade-off**: A saved cover can be replaced but not removed.
- **Scope**: projects feature - edit page
- **Date**: 2026-11-05
- **Status**: active

### AD-003 (active)

- **Decision**: Paginated lists load the next page by infinite scroll, not a numbered `Paginator`.
- **Reason**: The captures draw no paginator. Asked: "O que fazer quando há mais de 20?" - user: "Scroll infinito". Supersedes the `Paginator` shell anticipated in AGENTS.md.
- **Trade-off**: No jump to an arbitrary page; the list grows in memory as the user scrolls.
- **Scope**: every paginated list (projects list and search result first)
- **Date**: 2026-11-05
- **Status**: active

### AD-004 (active)

- **Decision**: In the project form, a client is valid when it is not blank (at least one word of any length); the project name keeps "at least two words" of any length.
- **Reason**: `new-project-validations.png` shows "Por favor, digite ao menos uma palavra" under the client "Iridium", which no rule the user wants can produce. Asked which rule applies - user: "uma palavra é pelo menos 3 caracteres", then, asked whether it also applies to the name - user: "apenas cliente e pode ser 2 caracteres na verdade".
- **Trade-off**: The captured error under "Iridium" is not reproduced; the front rejects one-letter clients the API would accept.
- **Scope**: projects feature - project form (create and edit)
- **Date**: 2026-11-05
- **Status**: active

## Handoff
