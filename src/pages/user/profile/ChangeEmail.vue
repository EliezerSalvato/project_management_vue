<script setup lang="ts">
import type { EmailForm } from '@/types/user'
import { updateEmail } from '@/api/user'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { useEndSession } from '@/composables/useEndSession'
import { useFormErrors } from '@/composables/useFormErrors'
import { reactive, ref } from 'vue'
import InputText from '@/components/inputs/InputText.vue'
import NotificationMessage from '@/components/NotificationMessage.vue'

const { t } = useI18n()
const userStore = useUserStore()
const endSessionAndRedirect = useEndSession()
const emailLoading = ref(false)

const emailForm = reactive<EmailForm>({
  currentPassword: '',
  newEmail: userStore.user?.email ?? '',
})

const { errors: emailErrors, validateWith, applyCatch } = useFormErrors(emailForm)

function validateEmail(): boolean {
  return validateWith((handler) => handler.checkBlank(['currentPassword', 'newEmail']))
}

async function onUpdateEmail() {
  if (!validateEmail()) return

  emailLoading.value = true

  try {
    const response = await updateEmail({ ...emailForm })
    await endSessionAndRedirect(response.message || t('user.changeEmail.success'))
  } catch (error) {
    applyCatch(error)
  } finally {
    emailLoading.value = false
  }
}
</script>

<template>
  <section class="project-form-panel">
    <form class="project-form" novalidate @submit.prevent="onUpdateEmail">
      <h2 class="profile-section-title">{{ t('user.changeEmail.title') }}</h2>

      <NotificationMessage
        v-if="emailErrors.base.length"
        type="danger"
        @close="emailErrors.base = []"
      >
        <p v-for="error in emailErrors.base" :key="error">{{ error }}</p>
      </NotificationMessage>

      <InputText
        v-model="emailForm.currentPassword"
        name="currentPassword"
        type="password"
        :label="t('user.changeEmail.currentPassword')"
        required
        required-text
        :errors="emailErrors.currentPassword"
        autocomplete="current-password"
      />

      <InputText
        v-model="emailForm.newEmail"
        name="email"
        type="email"
        :label="t('user.changeEmail.email')"
        required
        required-text
        :errors="emailErrors.newEmail"
        autocomplete="email"
      />

      <button
        type="submit"
        class="btn-pill project-form-submit"
        :class="{ 'btn-loading': emailLoading }"
        :disabled="emailLoading"
      >
        {{ t('buttons.save') }}
      </button>
    </form>
  </section>
</template>
