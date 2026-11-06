<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useId, useTemplateRef } from 'vue'

const { t } = useI18n()
const model = defineModel<string>()

const props = withDefaults(
  defineProps<{
    name?: string
    label?: string
    errors: string[]
    placeholder?: string
    required?: boolean
    requiredText?: boolean
    maxlength?: number
    type?: 'text' | 'email' | 'password'
    autocomplete?: string
  }>(),
  {
    required: false,
    requiredText: false,
    maxlength: 250,
    type: 'text',
  },
)

const emit = defineEmits<{
  'change:value': [payload: { name?: string; value: string }]
}>()

const input = useTemplateRef<HTMLInputElement>('input')
const id = useId()
const errorId = `${id}-error`

function updateValue(event: Event) {
  const value = (event.target as HTMLInputElement).value
  model.value = value
  emit('change:value', { name: props.name, value })
}

function focus() {
  input.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <div class="form-field">
    <label v-if="label" class="form-label" :for="id">
      {{ label }}
      <span v-if="required && requiredText" class="form-label-required">({{ t('required') }})</span>
      <abbr v-else-if="required" :title="t('required')" aria-hidden="true">*</abbr>
    </label>
    <input
      :id="id"
      :type="type"
      ref="input"
      class="form-input"
      :name="name"
      :aria-required="required"
      :aria-invalid="errors.length > 0"
      :aria-describedby="errorId"
      :value="model"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :class="{ 'form-input-error': errors.length > 0 }"
      @input="updateValue"
    />
    <p :id="errorId" class="form-help-error">{{ errors[0] }}</p>
  </div>
</template>
