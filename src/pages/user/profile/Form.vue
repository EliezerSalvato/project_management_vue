<script setup lang="ts">
import type { NameForm } from '@/types/user'
import { buildFullName } from '@/transformers/user'
import { updateProfile } from '@/api/user'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { useFormErrors } from '@/composables/useFormErrors'
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ChangeEmail from './ChangeEmail.vue'
import ChangePassword from './ChangePassword.vue'
import InputText from '@/components/inputs/InputText.vue'
import NotificationMessage from '@/components/NotificationMessage.vue'
import arrowLeftIconUrl from '@/assets/icons/arrow-left.svg'

const { t } = useI18n()
const userStore = useUserStore()
const notificationStore = useNotificationStore()
const nameLoading = ref(false)

const nameForm = reactive<NameForm>({
  firstName: userStore.user?.firstName ?? '',
  lastName: userStore.user?.lastName ?? '',
})

const { errors: nameErrors, validateWith, applyCatch } = useFormErrors(nameForm)

function validateName(): boolean {
  return validateWith((handler) => handler.checkBlank(['firstName', 'lastName']))
}

async function onUpdateName() {
  notificationStore.setCurrentMessage('')

  if (!validateName()) return

  nameLoading.value = true

  try {
    const response = await updateProfile({ ...nameForm })
    notificationStore.setCurrentMessage(response.message || t('user.profile.success'), 'success')

    if (userStore.user) {
      userStore.setUser({
        ...userStore.user,
        firstName: nameForm.firstName,
        lastName: nameForm.lastName,
        fullName: buildFullName(nameForm.firstName, nameForm.lastName),
      })
    }
  } catch (error) {
    applyCatch(error)
  } finally {
    nameLoading.value = false
  }
}
</script>

<template>
  <div class="project-page">
    <div class="project-page-content">
      <RouterLink class="page-back" :to="{ name: 'projects' }">
        <img :src="arrowLeftIconUrl" alt="" width="16" height="16" />
        {{ t('buttons.back') }}
      </RouterLink>
      <h1 class="project-page-title">{{ t('user.profile.title') }}</h1>

      <div class="profile-sections">
        <section class="project-form-panel">
          <form class="project-form" novalidate @submit.prevent="onUpdateName">
            <h2 class="profile-section-title">{{ t('user.profile.personalInfo') }}</h2>

            <NotificationMessage
              v-if="nameErrors.base.length"
              type="danger"
              @close="nameErrors.base = []"
            >
              <p v-for="error in nameErrors.base" :key="error">{{ error }}</p>
            </NotificationMessage>

            <InputText
              v-model="nameForm.firstName"
              name="firstName"
              :label="t('user.profile.firstName')"
              required
              required-text
              :errors="nameErrors.firstName"
              autocomplete="given-name"
            />

            <InputText
              v-model="nameForm.lastName"
              name="lastName"
              :label="t('user.profile.lastName')"
              required
              required-text
              :errors="nameErrors.lastName"
              autocomplete="family-name"
            />

            <button
              type="submit"
              class="btn-pill project-form-submit"
              :class="{ 'btn-loading': nameLoading }"
              :disabled="nameLoading"
            >
              {{ t('buttons.save') }}
            </button>
          </form>
        </section>

        <ChangeEmail />

        <ChangePassword />
      </div>
    </div>
  </div>
</template>
