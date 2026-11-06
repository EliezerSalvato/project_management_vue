<script setup lang="ts">
import type { RegistrationForm } from '@/types/user'
import { createRegistration } from '@/api/user'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notification'
import { useRouter } from 'vue-router'
import { useFormErrors } from '@/composables/useFormErrors'
import { reactive, ref } from 'vue'
import InputText from '@/components/inputs/InputText.vue'
import UserLinks from '@/components/user/UserLinks.vue'

const { t } = useI18n()
const router = useRouter()
const notificationStore = useNotificationStore()
const loading = ref(false)

const form = reactive<RegistrationForm>({
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  passwordConfirmation: '',
})

const { errors, validateWith, applyCatch } = useFormErrors(form)

function validate(): boolean {
  return validateWith((handler) =>
    handler
      .checkBlank(['email', 'firstName', 'lastName', 'password', 'passwordConfirmation'])
      .checkEmail(['email'])
      .checkMinLength(['password'], 8)
      .checkConfirmation('password', 'passwordConfirmation', t('user.registration.password')),
  )
}

async function onSubmit() {
  if (!validate()) return

  loading.value = true

  try {
    const response = await createRegistration({ ...form })
    await router.push({ name: 'signIn' })
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
      <h1 class="title">{{ t('user.registration.title') }}</h1>

      <form class="project-form" @submit.prevent="onSubmit">
        <InputText
          v-model="form.email"
          name="email"
          type="text"
          :label="t('user.registration.email')"
          required
          required-text
          :errors="errors.email"
          autocomplete="email"
        />

        <InputText
          v-model="form.firstName"
          name="firstName"
          :label="t('user.registration.firstName')"
          required
          required-text
          :errors="errors.firstName"
          autocomplete="given-name"
        />

        <InputText
          v-model="form.lastName"
          name="lastName"
          :label="t('user.registration.lastName')"
          required
          required-text
          :errors="errors.lastName"
          autocomplete="family-name"
        />

        <InputText
          v-model="form.password"
          name="password"
          type="password"
          :label="t('user.registration.password')"
          required
          required-text
          :errors="errors.password"
          autocomplete="new-password"
        />

        <InputText
          v-model="form.passwordConfirmation"
          name="passwordConfirmation"
          type="password"
          :label="t('user.registration.passwordConfirmation')"
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
          {{ t('buttons.signUp') }}
        </button>
      </form>

      <div class="auth-links">
        <UserLinks />
      </div>
    </div>
  </div>
</template>
