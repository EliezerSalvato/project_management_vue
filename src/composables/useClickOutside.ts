import type { Ref } from 'vue'
import { onScopeDispose, watch } from 'vue'

export function useClickOutside(
  target: Ref<HTMLElement | null>,
  handler: () => void,
  enabled: Ref<boolean>,
) {
  function onPointerDown(event: Event) {
    if (!target.value) return

    if (event.target instanceof Node && target.value.contains(event.target)) return

    handler()
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return

    handler()
  }

  function addListeners() {
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
  }

  function removeListeners() {
    document.removeEventListener('pointerdown', onPointerDown, true)
    document.removeEventListener('keydown', onKeyDown)
  }

  watch(enabled, (active) => (active ? addListeners() : removeListeners()), {
    immediate: true,
    flush: 'sync',
  })

  onScopeDispose(removeListeners)
}
