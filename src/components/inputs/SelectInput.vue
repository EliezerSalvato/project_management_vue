<script setup lang="ts" generic="T extends string">
import { useClickOutside } from '@/composables/useClickOutside'
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import chevronIconUrl from '@/assets/icons/chevron-down.svg'

type SelectOption = { value: T; label: string }

const props = defineProps<{
  options: SelectOption[]
  label: string
}>()

const model = defineModel<T>({ required: true })

const open = ref(false)
const root = useTemplateRef<HTMLElement>('root')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')

const selected = computed(() => props.options.find((option) => option.value === model.value))

function close() {
  open.value = false
}

function optionElements(): HTMLElement[] {
  return Array.from(root.value?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])
}

function focusOption(index: number) {
  const items = optionElements()
  if (!items.length) return

  items[(index + items.length) % items.length]?.focus()
}

async function openList() {
  open.value = true
  await nextTick()
  focusOption(
    Math.max(
      0,
      props.options.findIndex((option) => option.value === model.value),
    ),
  )
}

function toggle() {
  if (open.value) close()
  else void openList()
}

function moveFocus(event: KeyboardEvent, step: number) {
  focusOption(optionElements().indexOf(event.target as HTMLElement) + step)
}

function pick(value: T) {
  close()
  model.value = value
  trigger.value?.focus()
}

useClickOutside(root, close, open)
</script>

<template>
  <div ref="root" class="select-input" :class="{ 'select-input-open': open }">
    <button
      ref="trigger"
      type="button"
      class="select-input-trigger"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-label="label"
      @click="toggle"
      @keydown.down.prevent="openList"
      @keydown.up.prevent="openList"
    >
      <span>{{ selected?.label }}</span>
      <img class="select-input-chevron" :src="chevronIconUrl" alt="" width="16" height="16" />
    </button>

    <ul v-if="open" class="select-input-options" role="listbox" :aria-label="label">
      <li
        v-for="option in options"
        :key="option.value"
        class="select-input-option"
        role="option"
        tabindex="-1"
        :aria-selected="option.value === model"
        @click="pick(option.value)"
        @keydown.enter.prevent="pick(option.value)"
        @keydown.space.prevent="pick(option.value)"
        @keydown.down.prevent="moveFocus($event, 1)"
        @keydown.up.prevent="moveFocus($event, -1)"
        @keydown.home.prevent="focusOption(0)"
        @keydown.end.prevent="focusOption(-1)"
        @keydown.tab="close"
      >
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>
