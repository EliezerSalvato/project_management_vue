<script setup lang="ts">
import type { ForgotPasswordForm } from '@/types/user'
import { createPasswordReset } from '@/api/user'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notification'
import { useFormErrors } from '@/composables/useFormErrors'
import { reactive, ref } from 'vue'
import InputText from '@/components/inputs/InputText.vue'
import UserLinks from '@/components/user/UserLinks.vue'

const { t } = useI18n()
const notificationStore = useNotificationStore()
const loading = ref(false)

const form = reactive<ForgotPasswordForm>({
  email: '',
})

const { errors, validateWith, applyCatch } = useFormErrors(form)

function validate(): boolean {
  return validateWith((handler) => handler.checkBlank(['email']).checkEmail(['email']))
}

async function onSubmit() {
  if (!validate()) return

  loading.value = true
  notificationStore.setCurrentMessage('')

  try {
    const response = await createPasswordReset({ email: form.email })
    notificationStore.setCurrentMessage(response.message, 'success')
  } catch (error) {
    applyCatch(error)

    // General errors go to the global toast (right side, 5s) instead of inside the card.
    if (errors.value.base.length) {
      notificationStore.setCurrentMessage(errors.value.base.join(' '), 'danger')
      errors.value.base = []
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-shell auth-themed">
    <div class="auth-card">
      <h1 class="title">{{ t('user.forgotPassword.title') }}</h1>

      <form class="project-form" @submit.prevent="onSubmit">
        <InputText
          v-model="form.email"
          name="email"
          :label="t('user.forgotPassword.email')"
          required
          required-text
          :errors="errors.email"
          autocomplete="email"
        />

        <button
          type="submit"
          class="btn-pill project-form-submit"
          :class="{ 'btn-loading': loading }"
          :disabled="loading"
        >
          {{ t('buttons.sendResetPasswordInstructions') }}
        </button>
      </form>

      <div class="auth-links">
        <UserLinks />
      </div>
    </div>
  </div>
</template>
