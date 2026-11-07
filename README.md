# Project Management Vue

## Project overview

Single-page app for managing projects, built as the frontend of [project_management_ruby_api](https://github.com/EliezerSalvato/project_management_ruby_api). Users sign up, confirm their email, sign in and manage their projects (create, edit, delete, favorite, search) and profile, in English or Portuguese (`pt-BR`).

## Tech stack

<table>
  <tr>
    <td align="left">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg" alt="Vue" width="48" height="48" /><br />
      <strong>Vue</strong><br />
      3.5
    </td>
    <td align="left">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" alt="TypeScript" width="48" height="48" /><br />
      <strong>TypeScript</strong><br />
      6.0
    </td>
    <td align="left">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" alt="Vite" width="48" height="48" /><br />
      <strong>Vite</strong><br />
      8
    </td>
  </tr>
</table>

| Layer                | Technology                                           |
| -------------------- | ---------------------------------------------------- |
| State                | Pinia (setup stores)                                 |
| Routing              | Vue Router                                           |
| i18n                 | vue-i18n (`en`, `pt-BR`)                             |
| HTTP                 | Native `fetch` (`apiRequest` in `src/api/client.ts`) |
| Styling              | Plain CSS (`src/assets/main.css`)                    |
| Unit tests           | Vitest + jsdom                                       |
| E2E tests            | Playwright (mocked API and real API)                 |
| Linting & formatting | oxlint, ESLint, Prettier, vue-tsc                    |
| Package manager      | pnpm                                                 |
| CI                   | GitHub Actions                                       |
| Deploy               | Vercel                                               |

Architecture and coding conventions are described in [`AGENTS.md`](AGENTS.md); the reasoning behind the main choices is in [`TECHNICAL_DECISIONS.md`](TECHNICAL_DECISIONS.md).

## Requirements

- Node.js `^22.18.0` or `>=24.12.0`
- [pnpm](https://pnpm.io/installation)
- A running instance of [project_management_ruby_api](https://github.com/EliezerSalvato/project_management_ruby_api) (default `http://localhost:3000`)
- [Docker](https://docs.docker.com/get-docker/) (only for the real-API e2e tests)

## Setup instructions

```bash
git clone <repository-url>
cd project_management_vue

cp .env.sample .env

pnpm install
pnpm dev
```

A `Makefile` wraps the common scripts — run `make help` to list them.

## Environment variables

Copy `.env.sample` to `.env` and adjust values as needed.

| Variable            | Description         | Default                 |
| ------------------- | ------------------- | ----------------------- |
| `VITE_API_BASE_URL` | Base URL of the API | `http://localhost:3000` |

`VITE_*` variables are embedded in the bundle at build time — never put secrets in them. Keep `.env.sample` updated when adding new variables.

## Running locally

Start the API first (see its README), then:

```bash
pnpm dev
```

| Resource             | URL                                            |
| -------------------- | ---------------------------------------------- |
| App                  | [http://localhost:5173](http://localhost:5173) |
| Mailpit (API emails) | [http://localhost:8025](http://localhost:8025) |

The API must allow the app origin in `CORS_ORIGINS` and use it as `FRONTEND_URL` (both default to `http://localhost:5173`).

Production build:

```bash
pnpm build     # type-check + build into dist/
pnpm preview   # serve dist/ locally
```

### Common commands

| Command                  | Description                          |
| ------------------------ | ------------------------------------ |
| `pnpm dev`               | Start the Vite dev server            |
| `pnpm build`             | Type-check and build for production  |
| `pnpm type-check`        | Run `vue-tsc`                        |
| `pnpm lint`              | Run oxlint + ESLint (with `--fix`)   |
| `pnpm format`            | Format `src/` with Prettier          |
| `pnpm test:unit`         | Run unit tests (Vitest)              |
| `pnpm test:e2e`          | Run e2e tests against the mocked API |
| `pnpm test:e2e:real-api` | Run e2e tests against the real API   |

### App routes

| Path                   | Name             | Access        |
| ---------------------- | ---------------- | ------------- |
| `/projects`            | `projects`       | Authenticated |
| `/projects/new`        | `newProject`     | Authenticated |
| `/projects/search`     | `projectSearch`  | Authenticated |
| `/projects/:id/edit`   | `editProject`    | Authenticated |
| `/users/profile`       | `profile`        | Authenticated |
| `/users/sign-in`       | `signIn`         | Guest         |
| `/users/sign-up`       | `signUp`         | Guest         |
| `/users/password/new`  | `forgotPassword` | Guest         |
| `/users/password/edit` | `resetPassword`  | Guest         |
| `/users/confirmation`  | `confirmEmail`   | Public        |

`/` redirects to `/projects`. Filters and sort live in the route query (`?sort=`, `?favorite=true`).

## Running tests

### Unit tests

```bash
pnpm test:unit
```

Specs live next to the code in `__tests__/` folders (`src/api`, `src/composables`, `src/utils`, ...).

### End-to-end tests

Install the browser once:

```bash
pnpm exec playwright install chromium
```

**Mocked API** — fast, no backend needed. Every request goes to a fake host and is answered by `e2e/support/fixtures.ts`:

```bash
pnpm test:e2e
```

**Real API** — runs against [project_management_ruby_api](https://github.com/EliezerSalvato/project_management_ruby_api) in Docker, covering the API contract, the httpOnly refresh cookie, CORS and the emails (read from Mailpit). Expects the API checked out next to this repo (`../project_management_ruby_api`); override with `API_PATH`:

```bash
pnpm test:e2e:real-api
API_PATH=/path/to/project_management_ruby_api pnpm test:e2e:real-api
```

The run starts and stops an isolated stack (`e2e/backend/docker-compose.yml`: own in-memory database, own Mailpit, ports 3100/8126), so it never touches the development containers. To keep it up between runs:

```bash
docker compose -f e2e/backend/docker-compose.yml up -d --build
docker compose -f e2e/backend/docker-compose.yml down
```

## API documentation

The app consumes the REST API documented at [http://localhost:3000/docs](http://localhost:3000/docs) (Redoc, served by the API). All requests go through `apiRequest` in `src/api/client.ts`, which:

- prefixes `VITE_API_BASE_URL` and sends cookies (`credentials: 'include'`)
- adds `Authorization: Bearer <token>` when signed in
- sends the current locale as `Accept-Language`
- on `401`, refreshes the session once and retries the request
- throws `ApiError` (`status`, `message`, `details`) on failure

Endpoint wrappers live in `src/api/<domain>/` and map payloads through `src/transformers/`.

### Authentication

1. Sign up — `POST /api/v1/user/registrations`
2. Confirm email — the link in the email (see Mailpit) opens `/users/confirmation`, which calls `POST /api/v1/user/email/confirmations`
3. Sign in — `POST /api/v1/user/authentications` → `token` is kept in memory; `refresh_token` is set by the API as an httpOnly cookie
4. Refresh — `PATCH /api/v1/user/session/refreshes` on `401` and on page reload, before entering protected routes
5. Sign out — `DELETE /api/v1/user/session/revokes`

### Endpoints used

| Method               | Path                               | Wrapper                              |
| -------------------- | ---------------------------------- | ------------------------------------ |
| POST                 | `/api/v1/user/registrations`       | `src/api/user/registrations.ts`      |
| POST                 | `/api/v1/user/email/confirmations` | `src/api/user/emailConfirmations.ts` |
| POST / PATCH         | `/api/v1/user/password/resets`     | `src/api/user/passwordResets.ts`     |
| PATCH                | `/api/v1/user/profiles`            | `src/api/user/profiles.ts`           |
| PATCH                | `/api/v1/user/email/changes`       | `src/api/user/emailChanges.ts`       |
| PATCH                | `/api/v1/user/password/changes`    | `src/api/user/passwordChanges.ts`    |
| POST                 | `/api/v1/user/authentications`     | `src/api/auth/authentications.ts`    |
| PATCH                | `/api/v1/user/session/refreshes`   | `src/api/auth/sessionRefreshes.ts`   |
| DELETE               | `/api/v1/user/session/revokes`     | `src/api/auth/sessionRevokes.ts`     |
| GET / POST           | `/api/v1/projects`                 | `src/api/projects/projects.ts`       |
| GET / PATCH / DELETE | `/api/v1/projects/:id`             | `src/api/projects/projects.ts`       |
| POST / DELETE        | `/api/v1/projects/:id/favorite`    | `src/api/projects/favorites.ts`      |

Project lists are cursor-paginated (`after` / `next`) and rendered with infinite scroll.

## Deployment

Deployed on Vercel as a static SPA. `vercel.json` rewrites every path to `index.html` so deep links work. Set `VITE_API_BASE_URL` in the Vercel project environment, and add the deployed origin to the API's `CORS_ORIGINS` and `FRONTEND_URL`.

## Troubleshooting

**Requests fail with CORS errors**

- Confirm the API is running: `curl http://localhost:3000/up`
- Make sure the app origin is listed in the API's `CORS_ORIGINS`
- Check `VITE_API_BASE_URL` in `.env` and restart `pnpm dev` after changing it

**Session is lost on page reload**

The refresh token is an httpOnly cookie set by the API. Make sure the app and the API use the same host (`localhost` vs `127.0.0.1` count as different sites), and that the API's CORS config allows credentials.

**Email links point to the wrong host**

Set `FRONTEND_URL` in the API's `.env` to the app origin.

**Port 5173 already in use**

Vite picks the next free port. Use the URL printed in the terminal and add it to the API's `CORS_ORIGINS`, or stop the process using port 5173.

**Playwright cannot find the browser**

```bash
pnpm exec playwright install chromium
```

**Real-API e2e cannot find the API**

Check out the API next to this repo, or set `API_PATH` to its location. Make sure Docker is running and ports 3100/8126 are free.

**Deep links return 404 in production**

Make sure the host rewrites unknown paths to `index.html` (see `vercel.json`).
