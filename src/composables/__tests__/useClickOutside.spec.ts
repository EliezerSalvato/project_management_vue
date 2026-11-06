import type { EffectScope } from 'vue'
import { effectScope, ref } from 'vue'
import { useClickOutside } from '@/composables/useClickOutside'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let scope: EffectScope
let container: HTMLElement
let inner: HTMLElement
let outside: HTMLElement

function pointerDown(element: Element) {
  element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
}

function pressKey(key: string) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

function setup(enabled = ref(true)) {
  const handler = vi.fn()
  scope = effectScope()
  scope.run(() => useClickOutside(ref(container), handler, enabled))

  return handler
}

beforeEach(() => {
  container = document.createElement('div')
  inner = document.createElement('button')
  outside = document.createElement('p')
  container.append(inner)
  document.body.append(container, outside)
})

afterEach(() => {
  scope.stop()
  document.body.innerHTML = ''
})

describe('useClickOutside', () => {
  it('calls the handler on an outside click and on Escape', () => {
    const handler = setup()

    pointerDown(outside)
    pressKey('Escape')

    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('does not call the handler on an inside click or another key', () => {
    const handler = setup()

    pointerDown(inner)
    pointerDown(container)
    pressKey('Enter')

    expect(handler).not.toHaveBeenCalled()
  })

  it('does not call the handler while disabled', () => {
    const enabled = ref(false)
    const handler = setup(enabled)

    pointerDown(outside)
    pressKey('Escape')
    expect(handler).not.toHaveBeenCalled()

    enabled.value = true
    pointerDown(outside)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('removes the listeners when the scope stops', () => {
    const handler = setup()

    scope.stop()
    pointerDown(outside)
    pressKey('Escape')

    expect(handler).not.toHaveBeenCalled()
  })
})
