---
description: API, transformers e types — HTTP isolado, *Api vs domain
paths:
  - "src/api/**/*.ts"
  - "src/transformers/**/*.ts"
  - "src/types/**/*.ts"
---

# Data layer (api / transformers / types)

Base URL: `import.meta.env.VITE_API_BASE_URL` in `@/api/client`, from `.env` (see `.env.sample`).

## API (`src/api/`)

- Only call `apiRequest` from `@/api/client` — never raw `fetch` from pages/components.
- Paths: `/api/v1/...`. Domain folders + `index.ts` re-exports.
- Verb functions: `createRegistration`, `updateProfile`, `updateEmail`.
- Create/update/show usually return transformed domain results; simple mutations may return the API response type.

`apiRequest` already sends JSON + Bearer token, `Accept-Language` (current locale), credentials/locale cookie, retries once on `401`, throws `ApiError` (`status`, `message`, `details`).

## Transformers (`src/transformers/`)

Convert API ↔ domain. Named helpers: `registrationTransformer`, `userFromResource`.

- Normalize attributes with `keysToCamelCase` / `keysToSnakeCase` from `@/utils/case`.
- Never transform inside pages/components.
- Create/update: typed payloads built in the page/API layer.

## Types (`src/types/`)

| Kind     | Example                                              |
| -------- | ---------------------------------------------------- |
| Domain   | `User`                                               |
| API wire | `UserAttributesApi`, `AuthSessionSuccessResponseApi` |
| Form     | `LoginForm`, `NameForm`                              |
| Request  | `RegistrationPayload`                                |

No `I` prefix. Avoid `any`; prefer `unknown`, generics, explicit types. Domain camelCase; API shapes use `*Api` when they differ.
