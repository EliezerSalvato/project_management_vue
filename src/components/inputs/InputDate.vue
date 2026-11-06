<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useId, useTemplateRef } from 'vue'

const { t } = useI18n()
const model = defineModel<string>()

withDefaults(
  defineProps<{
    name: string
    label: string
    errors: string[]
    icon: string
    required?: boolean
  }>(),
  { required: false },
)

const id = useId()
const errorId = `${id}-error`
const input = useTemplateRef<HTMLInputElement>('input')

function openPicker() {
  input.value?.showPicker()
}

function updateValue(event: Event) {
  model.value = (event.target as HTMLInputElement).value
}
</script>

<template>
  <div class="form-field">
    <label class="form-label" :for="id">
      {{ label }}
      <span v-if="required" class="form-label-required">({{ t('required') }})</span>
    </label>
    <div class="form-input-date">
      <input
        :id="id"
        ref="input"
        type="date"
        class="form-input"
        :class="{ 'form-input-error': errors.length > 0, 'form-input-empty': !model }"
        :name="name"
        :aria-required="required"
        :aria-invalid="errors.length > 0"
        :aria-describedby="errorId"
        :value="model"
        @input="updateValue"
        @change="updateValue"
      />
      <img
        class="form-input-date-icon"
        :src="icon"
        alt=""
        width="24"
        height="24"
        @click="openPicker"
      />
    </div>
    <p :id="errorId" class="form-help-error">{{ errors[0] }}</p>
  </div>
</template>
