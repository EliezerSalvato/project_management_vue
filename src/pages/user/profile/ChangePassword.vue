<script setup lang="ts">
import type { PasswordForm } from '@/types/user'
import { updatePassword } from '@/api/user'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notification'
import { useRouter } from 'vue-router'
import { useFormErrors } from '@/composables/useFormErrors'
import { reactive, ref } from 'vue'
import InputText from '@/components/inputs/InputText.vue'
import NotificationMessage from '@/components/NotificationMessage.vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const passwordLoading = ref(false)

const passwordForm = reactive<PasswordForm>({
  currentPassword: '',
  password: '',
  passwordConfirmation: '',
})

const { errors: passwordErrors, validateWith, applyCatch } = useFormErrors(passwordForm)

function validatePassword(): boolean {
  return validateWith((handler) =>
    handler
      .checkBlank(['currentPassword', 'password', 'passwordConfirmation'])
      .checkMinLength(['password'], 8)
      .checkConfirmation('password', 'passwordConfirmation', t('user.changePassword.password')),
  )
}

async function endSessionAndRedirect(notice: string) {
  try {
    await authStore.logout()
  } catch {
    // logout() já limpa o estado local se a revogação falhar
  }

  await router.push({ name: 'signIn' })
  notificationStore.setCurrentMessage(notice, 'success')
}

async function onUpdatePassword() {
  if (!validatePassword()) return

  passwordLoading.value = true

  try {
    const response = await updatePassword({ ...passwordForm })
    await endSessionAndRedirect(response.message || t('user.changePassword.success'))
  } catch (error) {
    applyCatch(error)
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <section class="project-form-panel">
    <form class="project-form" novalidate @submit.prevent="onUpdatePassword">
      <h2 class="profile-section-title">{{ t('user.changePassword.title') }}</h2>

      <NotificationMessage
        v-if="passwordErrors.base.length"
        type="danger"
        @close="passwordErrors.base = []"
      >
        <p v-for="error in passwordErrors.base" :key="error">{{ error }}</p>
      </NotificationMessage>

      <InputText
        v-model="passwordForm.currentPassword"
        name="currentPassword"
        type="password"
        :label="t('user.changePassword.currentPassword')"
        required
        required-text
        :errors="passwordErrors.currentPassword"
        autocomplete="current-password"
      />

      <InputText
        v-model="passwordForm.password"
        name="password"
        type="password"
        :label="t('user.changePassword.password')"
        required
        required-text
        :errors="passwordErrors.password"
        autocomplete="new-password"
      />

      <InputText
        v-model="passwordForm.passwordConfirmation"
        name="passwordConfirmation"
        type="password"
        :label="t('user.changePassword.passwordConfirmation')"
        required
        required-text
        :errors="passwordErrors.passwordConfirmation"
        autocomplete="new-password"
      />

      <button
        type="submit"
        class="btn-pill project-form-submit"
        :class="{ 'btn-loading': passwordLoading }"
        :disabled="passwordLoading"
      >
        {{ t('buttons.save') }}
      </button>
    </form>
  </section>
</template>
