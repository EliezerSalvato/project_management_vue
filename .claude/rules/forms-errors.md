---
description: Formulários, validação, ApiError e notifications
paths:
  - "src/pages/**/*.vue"
  - "src/composables/useFormErrors.ts"
  - "src/utils/errorsHandler.ts"
  - "src/utils/validators/**"
---

# Forms, validation & errors

Use `@/composables/useFormErrors` in pages:

- `validateWith((handler) => handler.checkBlank([...]))` for client-side validation
- `applyCatch(error)` to map `ApiError.details` to fields (falls back to `base`)
- `errors.base` rendered through `NotificationMessage type="danger"`

Validators live in `@/utils/validators`; the chainable API is `@/utils/errorsHandler`
(`checkBlank`, `checkEmail`, `checkMinLength`, `checkMaxLength`, `checkConfirmation`, `applyApiDetails`).

Catch `ApiError` from `@/api/client`. Never silently ignore errors — handle, display, or propagate.

Notifications: `useNotificationStore().setCurrentMessage(message, type?)` (`success` | `danger`).

Reference forms: `pages/user/Registration.vue`, `pages/user/profile/ChangePassword.vue`.
