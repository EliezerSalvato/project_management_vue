<script setup lang="ts">
import type { LoginForm } from '@/types/auth'
import { createAuthentication } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { useFormErrors } from '@/composables/useFormErrors'
import { safeRedirectPath } from '@/utils/safeRedirect'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NotificationMessage from '@/components/NotificationMessage.vue'
import UserLinks from '@/components/user/UserLinks.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const userStore = useUserStore()
const loading = ref(false)

const form = reactive<LoginForm>({
  email: '',
  password: '',
  rememberMe: false,
})

const { errors, validateWith, applyCatch } = useFormErrors(form)

function validate(): boolean {
  return validateWith((handler) => handler.checkBlank(['email', 'password']))
}

async function onSubmit() {
  if (!validate()) return

  loading.value = true

  try {
    const response = await createAuthentication({ ...form })
    authStore.setToken(response.data.token)
    authStore.setRememberMe(form.rememberMe)
    userStore.setUser(response.data.user)

    await router.push(safeRedirectPath(route.query.redirect))
  } catch (error) {
    applyCatch(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-shell">
    <div class="auth-card">
      <h1 class="title">{{ t('auth.login.title') }}</h1>

      <form @submit.prevent="onSubmit">
        <NotificationMessage />

        <NotificationMessage v-if="errors.base.length" type="danger" @close="errors.base = []">
          <p v-for="error in errors.base" :key="error">{{ error }}</p>
        </NotificationMessage>

        <div class="form-field">
          <input
            v-model="form.email"
            type="text"
            name="email"
            class="form-input"
            :class="{ 'form-input-error': errors.email.length }"
            :placeholder="t('auth.login.emailPlaceholder')"
            :aria-label="t('auth.login.email')"
            :aria-invalid="errors.email.length > 0"
            autocomplete="username"
            autofocus
          />
          <p v-if="errors.email.length" class="form-help-error">
            {{ errors.email[0] }}
          </p>
        </div>

        <div class="form-field">
          <input
            v-model="form.password"
            type="password"
            name="password"
            class="form-input"
            :class="{ 'form-input-error': errors.password.length }"
            :placeholder="t('auth.login.passwordPlaceholder')"
            :aria-label="t('auth.login.password')"
            :aria-invalid="errors.password.length > 0"
            autocomplete="current-password"
          />
          <p v-if="errors.password.length" class="form-help-error">
            {{ errors.password[0] }}
          </p>
        </div>

        <div class="form-field form-submit">
          <label class="checkbox-label">
            <input v-model="form.rememberMe" type="checkbox" name="rememberMe" />
            {{ t('auth.login.rememberMe') }}
          </label>
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-block"
          :class="{ 'btn-loading': loading }"
          :disabled="loading"
        >
          {{ t('buttons.login') }}
        </button>
      </form>

      <div class="auth-links">
        <UserLinks />
      </div>
    </div>
  </div>
</template>
