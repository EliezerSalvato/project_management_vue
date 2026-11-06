<script setup lang="ts">
import type { Project } from '@/types/project'
import type { AppLocale } from '@/locales/locale'
import { useI18n } from 'vue-i18n'
import { formatLongDate } from '@/utils/date'
import { highlightSegments } from '@/utils/highlight'
import { useClickOutside } from '@/composables/useClickOutside'
import { computed, toRef, useTemplateRef } from 'vue'
import { RouterLink } from 'vue-router'
import calendarCheckIconUrl from '@/assets/icons/calendar-check-light.svg'
import calendarDayIconUrl from '@/assets/icons/calendar-day-light.svg'
import favoriteIconUrl from '@/assets/icons/favorite.svg'
import favoritedIconUrl from '@/assets/icons/favorited.svg'
import editIconUrl from '@/assets/icons/edit.svg'
import moreIconUrl from '@/assets/icons/more.svg'
import trashIconUrl from '@/assets/icons/trash-1.svg'
import placeholderIconUrl from '@/assets/icons/cover-placeholder.svg'

const props = defineProps<{
  project: Project
  menuOpen: boolean
  highlight?: string
  favoritePending?: boolean
}>()

const emit = defineEmits<{
  toggleFavorite: [project: Project]
  toggleMenu: []
  closeMenu: []
  remove: [project: Project]
}>()

const { t, locale } = useI18n()

const menu = useTemplateRef<HTMLElement>('menu')

useClickOutside(menu, () => emit('closeMenu'), toRef(props, 'menuOpen'))

const nameSegments = computed(() => highlightSegments(props.project.name, props.highlight ?? ''))
const clientSegments = computed(() =>
  highlightSegments(props.project.clientName, props.highlight ?? ''),
)

function formatDate(value: string) {
  return formatLongDate(value, locale.value as AppLocale)
}

function onRemove() {
  emit('closeMenu')
  emit('remove', props.project)
}
</script>

<template>
  <article
    class="project-card"
    :class="{ 'project-card-menu-open': menuOpen }"
    :aria-label="project.name"
  >
    <div class="project-card-cover">
      <img
        v-if="project.coverImageUrl"
        class="project-card-cover-image"
        :src="project.coverImageUrl"
        alt=""
      />
      <img
        v-else
        :src="placeholderIconUrl"
        alt=""
        width="84"
        height="70"
        data-testid="cover-placeholder"
      />

      <div class="project-card-actions">
        <button
          type="button"
          class="project-card-favorite"
          :aria-label="t('project.card.favorite')"
          :aria-pressed="project.favorite"
          :aria-busy="favoritePending"
          :disabled="favoritePending"
          @click="emit('toggleFavorite', project)"
        >
          <img :src="project.favorite ? favoritedIconUrl : favoriteIconUrl" alt="" />
        </button>

        <div ref="menu" class="project-card-menu">
          <button
            type="button"
            class="project-card-menu-trigger"
            :aria-label="t('project.card.options')"
            aria-haspopup="menu"
            :aria-expanded="menuOpen"
            @click="emit('toggleMenu')"
          >
            <img :src="moreIconUrl" alt="" width="16" height="4" />
          </button>

          <div v-if="menuOpen" class="project-card-menu-list" role="menu">
            <RouterLink
              class="project-card-menu-item"
              role="menuitem"
              :to="{ name: 'editProject', params: { id: project.id } }"
            >
              <img :src="editIconUrl" alt="" width="24" height="24" />
              {{ t('project.card.edit') }}
            </RouterLink>
            <button type="button" class="project-card-menu-item" role="menuitem" @click="onRemove">
              <img :src="trashIconUrl" alt="" width="24" height="24" />
              {{ t('project.card.remove') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="project-card-body">
      <div class="project-card-info">
        <h2 class="project-card-name">
          <template v-for="(segment, index) in nameSegments" :key="index">
            <mark v-if="segment.match" class="project-card-highlight">{{ segment.text }}</mark>
            <template v-else>{{ segment.text }}</template>
          </template>
        </h2>
        <p class="project-card-client">
          <strong>{{ t('project.card.client') }}</strong>
          <span>
            <template v-for="(segment, index) in clientSegments" :key="index">
              <mark v-if="segment.match" class="project-card-highlight">{{ segment.text }}</mark>
              <template v-else>{{ segment.text }}</template>
            </template>
          </span>
        </p>
      </div>

      <dl class="project-card-dates">
        <div class="project-card-date">
          <dt><img :src="calendarDayIconUrl" :alt="t('project.card.startDate')" /></dt>
          <dd>{{ formatDate(project.startDate) }}</dd>
        </div>
        <div class="project-card-date">
          <dt><img :src="calendarCheckIconUrl" :alt="t('project.card.endDate')" /></dt>
          <dd>{{ formatDate(project.endDate) }}</dd>
        </div>
      </dl>
    </div>
  </article>
</template>
