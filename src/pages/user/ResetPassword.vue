<script setup lang="ts">
import type { PasswordResetUpdatePayload, ResetPasswordForm } from '@/types/user'
import { updatePasswordReset } from '@/api/user'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notification'
import { useFormErrors } from '@/composables/useFormErrors'
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InputText from '@/components/inputs/InputText.vue'
import UserLinks from '@/components/user/UserLinks.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const notificationStore = useNotificationStore()
const loading = ref(false)

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const form = reactive<ResetPasswordForm>({
  password: '',
  passwordConfirmation: '',
})

const { errors, validateWith, applyCatch } = useFormErrors((): PasswordResetUpdatePayload => ({
  ...form,
  token: token.value,
}))

function validate(): boolean {
  return validateWith((handler) =>
    handler
      .checkBlank(['token', 'password', 'passwordConfirmation'])
      .checkMinLength(['password'], 8)
      .checkConfirmation('password', 'passwordConfirmation', t('user.resetPassword.password')),
  )
}

// General and token errors have no field to sit under, so they go to the global toast.
function showGeneralErrors() {
  const messages = [...errors.value.base, ...errors.value.token]

  if (!messages.length) return

  notificationStore.setCurrentMessage(messages.join(' '), 'danger')
  errors.value.base = []
  errors.value.token = []
}

async function onSubmit() {
  if (!validate()) {
    showGeneralErrors()
    return
  }

  loading.value = true

  try {
    const response = await updatePasswordReset({
      token: token.value,
      password: form.password,
      passwordConfirmation: form.passwordConfirmation,
    })

    await router.push({ name: 'signIn' })
    notificationStore.setCurrentMessage(response.message, 'success')
  } catch (error) {
    applyCatch(error)
    showGeneralErrors()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-shell auth-themed">
    <div class="auth-card">
      <h1 class="title">{{ t('user.resetPassword.title') }}</h1>

      <form class="project-form" @submit.prevent="onSubmit">
        <InputText
          v-model="form.password"
          name="password"
          type="password"
          :label="t('user.resetPassword.password')"
          required
          required-text
          :errors="errors.password"
          autocomplete="new-password"
        />

        <InputText
          v-model="form.passwordConfirmation"
          name="passwordConfirmation"
          type="password"
          :label="t('user.resetPassword.passwordConfirmation')"
          required
          required-text
          :errors="errors.passwordConfirmation"
          autocomplete="new-password"
        />

        <button
          type="submit"
          class="btn-pill project-form-submit form-submit"
          :class="{ 'btn-loading': loading }"
          :disabled="loading"
        >
          {{ t('buttons.changeMyPassword') }}
        </button>
      </form>

      <div class="auth-links">
        <UserLinks />
      </div>
    </div>
  </div>
</template>
