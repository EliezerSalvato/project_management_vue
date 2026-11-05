# project-management-vue

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```

### End-to-end tests ([Playwright](https://playwright.dev/))

Install the browser once:

```sh
pnpm exec playwright install chromium
```

**Mocked API** — fast, no backend needed. Every request goes to a fake host and is answered
by `e2e/support/fixtures.ts`:

```sh
pnpm test:e2e
```

**Real API** — runs against [project_management_ruby_api](https://github.com/EliezerSalvato/project_management_ruby_api)
in Docker, covering the API contract, the httpOnly refresh cookie, CORS and the emails (read
from Mailpit). Expects the API checked out next to this repo (`../project_management_ruby_api`);
override with `API_PATH`:

```sh
pnpm test:e2e:real-api
API_PATH=/path/to/project_management_ruby_api pnpm test:e2e:real-api
```

The run starts and stops an isolated stack (`e2e/backend/docker-compose.yml`: own database in
memory, own Mailpit, ports 3100/8126), so it never touches the development containers. To keep
it up between runs:

```sh
docker compose -f e2e/backend/docker-compose.yml up -d --build
docker compose -f e2e/backend/docker-compose.yml down
```
