<script setup lang="ts">
import type { ProjectForm, ProjectPayload } from '@/types/project'
import { useI18n } from 'vue-i18n'
import { useFormErrors } from '@/composables/useFormErrors'
import { useNotificationStore } from '@/stores/notification'
import { computed, onBeforeUnmount, onMounted, reactive, ref, useTemplateRef, watch } from 'vue'
import { parseIsoDate, todayIso } from '@/utils/date'
import { coverFileValidator, dateValidator, minWordsValidator } from '@/utils/validators'
import calendarCheckIconUrl from '@/assets/icons/calendar-check-light.svg'
import calendarDayIconUrl from '@/assets/icons/calendar-day-light.svg'
import CoverUpload from '@/components/inputs/CoverUpload.vue'
import InputDate from '@/components/inputs/InputDate.vue'
import InputText from '@/components/inputs/InputText.vue'

type Field = Exclude<keyof ProjectForm, 'coverImage'>

const props = withDefaults(
  defineProps<{
    initial?: ProjectForm
    original?: Pick<ProjectForm, 'startDate' | 'endDate'>
    savedCoverUrl?: string | null
    loading?: boolean
  }>(),
  { initial: undefined, original: undefined, savedCoverUrl: null, loading: false },
)

const emit = defineEmits<{ submit: [payload: ProjectPayload] }>()

const { t } = useI18n()

const form = reactive<ProjectForm>(
  props.initial
    ? { ...props.initial }
    : { name: '', clientName: '', startDate: '', endDate: '', coverImage: null },
)
const touched = reactive<Record<Field, boolean>>({
  name: false,
  clientName: false,
  startDate: false,
  endDate: false,
})

const notificationStore = useNotificationStore()
const { errors: apiErrors, applyCatch: applyFormCatch, createHandler, resetErrors } =
  useFormErrors(form)

// General errors go to the global toast (right side, 5s) instead of inside the form.
function applyCatch(error: unknown) {
  applyFormCatch(error)

  if (apiErrors.value.base.length) {
    notificationStore.setCurrentMessage(apiErrors.value.base.join(' '), 'danger')
    apiErrors.value.base = []
  }
}

const today = todayIso()

// A new project has no original dates, so every date counts as changed.
function isChanged(field: 'startDate' | 'endDate') {
  return !props.original || form[field] !== props.original[field]
}

const validation = computed(() => {
  const dateMessage = t('project.form.errors.date')
  const beforeTodayMessage = t('project.form.errors.beforeToday')

  // Untouched saved dates may already be in the past; only edited dates must not be.
  const minStartDate = isChanged('startDate') ? today : undefined

  // The end date never precedes a valid start date, and an edited end date can't be in the past.
  // `YYYY-MM-DD` strings compare chronologically, so `>` picks the later date.
  const startDate = parseIsoDate(form.startDate) ? form.startDate : undefined
  const endNotBeforeToday = isChanged('endDate') && (!startDate || today > startDate)
  const minEndDate = endNotBeforeToday ? today : startDate

  return createHandler()
    .check(['name'], minWordsValidator(2, t('project.form.errors.twoWords')))
    .check(['clientName'], minWordsValidator(1, t('project.form.errors.oneWord')))
    .check(
      ['startDate'],
      dateValidator({ notBefore: minStartDate, notBeforeMessage: beforeTodayMessage }, dateMessage),
    )
    .check(
      ['endDate'],
      dateValidator(
        {
          notBefore: minEndDate,
          notBeforeMessage: endNotBeforeToday ? beforeTodayMessage : dateMessage,
        },
        dateMessage,
      ),
    )
})

function fieldErrors(field: Field) {
  const clientSide = touched[field] ? validation.value.all[field] : []

  return [...clientSide, ...apiErrors.value[field]]
}

watch(
  () => ({ ...form }),
  () => resetErrors(),
)

const pickedCoverUrl = ref<string | null>(null)
const coverError = ref('')
const savedCoverRemoved = ref(false)
const previewUrl = computed(
  () => pickedCoverUrl.value ?? (savedCoverRemoved.value ? null : props.savedCoverUrl),
)

function releasePickedCover() {
  if (pickedCoverUrl.value) URL.revokeObjectURL(pickedCoverUrl.value)

  pickedCoverUrl.value = null
}

function onCoverSelect(file: File) {
  const { isValid, errorMessage } = coverFileValidator(file)

  if (!isValid) {
    coverError.value = errorMessage
    return
  }

  coverError.value = ''
  releasePickedCover()
  form.coverImage = file
  pickedCoverUrl.value = URL.createObjectURL(file)
}

function onCoverClear() {
  releasePickedCover()
  form.coverImage = null
  if (props.savedCoverUrl) savedCoverRemoved.value = true
}

onBeforeUnmount(releasePickedCover)

const nameInput = useTemplateRef<InstanceType<typeof InputText>>('nameInput')

onMounted(() => nameInput.value?.focus())

function onSubmit() {
  ;(Object.keys(touched) as Field[]).forEach((field) => (touched[field] = true))

  if (props.loading || !validation.value.isValid) return

  emit('submit', { ...form, removeCoverImage: savedCoverRemoved.value })
}

defineExpose({ applyCatch })
</script>

<template>
  <form class="project-form" novalidate @submit.prevent="onSubmit">
    <InputText
      ref="nameInput"
      v-model="form.name"
      name="name"
      :label="t('project.form.name')"
      required
      required-text
      :maxlength="255"
      :errors="fieldErrors('name')"
      @focusout="touched.name = true"
    />

    <InputText
      v-model="form.clientName"
      name="clientName"
      :label="t('project.form.clientName')"
      required
      required-text
      :maxlength="255"
      :errors="fieldErrors('clientName')"
      @focusout="touched.clientName = true"
    />

    <div class="project-form-dates">
      <InputDate
        v-model="form.startDate"
        name="startDate"
        :label="t('project.form.startDate')"
        :icon="calendarDayIconUrl"
        required
        :errors="fieldErrors('startDate')"
        @focusout="touched.startDate = true"
      />

      <InputDate
        v-model="form.endDate"
        name="endDate"
        :label="t('project.form.endDate')"
        :icon="calendarCheckIconUrl"
        required
        :errors="fieldErrors('endDate')"
        @focusout="touched.endDate = true"
      />
    </div>

    <CoverUpload
      :label="t('project.form.cover')"
      :hint="t('project.form.coverHint')"
      :select-label="t('project.form.coverSelect')"
      :remove-label="t('project.form.coverRemove')"
      :preview-alt="t('project.form.coverPreview')"
      :preview-url="previewUrl"
      :error="coverError || apiErrors.coverImage[0]"
      @select="onCoverSelect"
      @clear="onCoverClear"
    />

    <button
      type="submit"
      class="btn-pill project-form-submit"
      :class="{ 'btn-loading': loading }"
      :disabled="loading || !validation.isValid"
    >
      {{ t('project.form.submit') }}
    </button>
  </form>
</template>
