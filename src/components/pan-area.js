import componentBehaviourMixin from '../behaviour/component-behaviour.js'
import touchCapabilities, { normalizeTouchActions } from '../helpers/touch-capabilities.js'
import { parsePercentage, toPercentage } from '../helpers/style.js'

export default class PanArea extends componentBehaviourMixin(HTMLElement) {
  // Constructor can't be used reliably in polyfill'ed custom elements

  static get style() {
    return /* css */ `
      :host {
        --pan-x: 0%;
        --pan-y: 0%;
        --zoom-y: 100%;
        --zoom-x: 100%;
        overflow: hidden;
      }

      :host .wrapper,
      :host .wrapper > ::slotted(*) {
        position: relative;
      }

      :host .scale,
      :host .wrapper > ::slotted(*) {
        top: 0;
        left: 0;
      }

      :host .pan, 
      :host .wrapper > ::slotted(*) {
        width: 100%;
        height: 100%;
      }

      :host .pan {
        top: var(--pan-y);
        left: var(--pan-x);
        transition: left 100ms ease-out;
      }

      :host .scale {
        width: var(--zoom-x);
        height: var(--zoom-y);
        transition: width 100ms ease-out;
      }
    `
  }

  static get template() {
    return /* html */ `
    <div class="wrapper pan">
      <div class="wrapper scale">
        <slot>
      </div>
    </div>
    `
  }

  static get observedAttributes() {
    // Whitelist of attributes for browser to fire `attributeChangedCallback`
    // when changed
    return ['touch-action']
  }

  static get attributesProperties() {
    // List of modifier functions for attributes values
    return {
      animating: val => val === 'true',
      'touch-action': {
        get: normalizeTouchActions,
        set: normalizeTouchActions
      }
    }
  }

  pan(x, y) {
    console.log(x, y)
    const cssSyle = window.getComputedStyle(this)
    const panX = Math.min(parsePercentage(cssSyle.getPropertyValue('--pan-x')) + x, 0)

    this.style.setProperty('--pan-x', toPercentage(panX))
    this.style.setProperty(
      '--pan-y',
      toPercentage(parsePercentage(cssSyle.getPropertyValue('--pan-y')) + y)
    )
  }

  zoom(x, y) {
    const cssSyle = window.getComputedStyle(this)
    const scaleX = Math.max(parsePercentage(cssSyle.getPropertyValue('--zoom-x')) + x, 100)
    const scaleY = Math.max(parsePercentage(cssSyle.getPropertyValue('--zoom-y')) + y, 100)
    this.style.setProperty('--zoom-x', toPercentage(scaleX))
    this.style.setProperty('--zoom-y', toPercentage(scaleY))
  }

  zoomPanFix(cursorX, cursorY, scrollX, scrollY) {
    let panX, panY
    const rect = this.getBoundingClientRect()
    const wrapperRect = this.shadowRoot.querySelector('.wrapper.scale').getBoundingClientRect()
    const scaleRightDistance = wrapperRect.left + wrapperRect.width - (rect.left + rect.width)
    const maintainRightPercentage = (Math.max(-scaleRightDistance, 0) / rect.width) * 100

    if (maintainRightPercentage > 0) {
      panX = maintainRightPercentage
    } else {
      const correctRightDrift = (scaleRightDistance / rect.width) * 100
      const cursorCenterDrift = (scrollX * (cursorX - rect.left)) / rect.width
      panX = Math.min(correctRightDrift, cursorCenterDrift)
    }

    this.pan(panX, (scrollY * (cursorY - rect.top)) / rect.height)
  }

  init() {
    if (!this.hasAttribute('touch-action')) {
      this.dataset.touchAction = 'auto'
    }

    this.addEventListener('error', event => console.warn(event.error))
    this.addEventListener('wheel', event => {
      if (this.dataset.animating) return

      let scrollX, scrollY
      const capabilities = touchCapabilities(this.dataset.touchAction)

      if (event.deltaX === 0 && event.shiftKey) {
        scrollX = event.deltaY
        scrollY = 0
      } else {
        scrollX = event.deltaX
        scrollY = event.deltaY
      }

      if (!capabilities.has('pan-x')) scrollX = 0
      if (!capabilities.has('pan-y')) scrollY = 0
      if (scrollX === 0 && scrollY === 0) return

      this.addEventListener(
        'fix-scale-pan',
        () => this.zoomPanFix(event.clientX, event.clientY, scrollX, scrollY),
        {
          once: true
        }
      )

      this.zoom(-scrollX, -scrollY)

      event.preventDefault()
    })

    const activePointerEvents = new Map()
    this.addEventListener('pointerup', event => {
      activePointerEvents.delete(event.pointerId)
    })
    this.addEventListener('pointerdown', event => {
      activePointerEvents.set(event.pointerId, event)
    })
    this.addEventListener('pointermove', event => {
      if (this.dataset.animating) return

      const oldEvent = activePointerEvents.get(event.pointerId)
      const capabilities = touchCapabilities(this.dataset.touchAction)

      // Replace with new event
      activePointerEvents.set(event.pointerId, event)

      if (oldEvent == null) return

      switch (activePointerEvents.size) {
        case 1: {
          const x = capabilities.has('pan-x') ? Math.abs(event.clientX - oldEvent.clientX) : 0

          if (x === 0) return

          break
        }
        case 2: {
          if (!capabilities.has('pinch-zoom')) return

          const [firstEvent, secondEvent] = activePointerEvents.values()
          this.zoom(
            Math.abs(firstEvent.clientX - secondEvent.clientX),
            Math.abs(firstEvent.clientY - secondEvent.clientY)
          )
          break
        }
        default:
          return
      }

      event.preventDefault()
    })

    this.shadowRoot.addEventListener('transitionend', () => {
      /**
       * WARNING: the following order is relevant due to internaltransitionend
       * listeners being able to initiate a new transition event
       */
      this.dataset.animating = false
      this.dispatchEvent(new Event('fix-scale-pan'))
    })
    this.shadowRoot.addEventListener('transitionstart', () => {
      this.dataset.animating = true
    })
    this.shadowRoot.addEventListener('transitioncancel', () => {
      /**
       * WARNING: the following order is relevant due to internaltransitionend
       * listeners being able to initiate a new transition event
       */
      this.dataset.animating = false
      this.dispatchEvent(new Event('fix-scale-pan'))
    })
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    switch (attrName) {
      case 'touch-action': {
        this.style.setProperty('touch-action', this.dataset.touchAction)
        break
      }
      default: {
        super.attributeChangedCallback(attrName, oldVal, newVal)
      }
    }
  }

  reset() {
    const didReset = super.reset()

    if (didReset) {
      this.dispatchEvent(new Event('internaltransitionend'))
    }

    return didReset
  }
}
