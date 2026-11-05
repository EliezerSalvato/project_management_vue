<script setup lang="ts">
import type { EmailConfirmationPayload } from '@/types/user'
import { createEmailConfirmation } from '@/api/user'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notification'
import { useFormErrors } from '@/composables/useFormErrors'
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Loading from '@/components/Loading.vue'
import NotificationMessage from '@/components/NotificationMessage.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const notificationStore = useNotificationStore()

const loading = ref(true)
const form = reactive<EmailConfirmationPayload>({ token: '' })
const { errors, applyCatch, createHandler } = useFormErrors(form)

async function confirmEmail() {
  form.token = typeof route.query.token === 'string' ? route.query.token : ''

  if (!form.token) {
    errors.value = createHandler().addBase(t('user.confirmEmail.tokenMissing')).all
    loading.value = false
    return
  }

  try {
    const response = await createEmailConfirmation({ token: form.token })
    await router.push({ name: 'signIn' })
    notificationStore.setCurrentMessage(response.message, 'success')
  } catch (error) {
    applyCatch(error)
  } finally {
    loading.value = false
  }
}

function clearErrors() {
  errors.value = { ...errors.value, base: [], token: [] }
}

onMounted(() => {
  void confirmEmail()
})
</script>

<template>
  <div class="auth-shell">
    <div class="auth-card">
      <h1 class="title">{{ t('user.confirmEmail.title') }}</h1>

      <div v-if="loading">
        <p>{{ t('user.confirmEmail.confirming') }}</p>
        <Loading />
      </div>

      <div v-else-if="errors.base.length || errors.token.length">
        <NotificationMessage type="danger" @close="clearErrors">
          <p v-for="error in errors.base" :key="error">{{ error }}</p>
          <p v-for="error in errors.token" :key="error">{{ error }}</p>
        </NotificationMessage>
      </div>
    </div>
  </div>
</template>
