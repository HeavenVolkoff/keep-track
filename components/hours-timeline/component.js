import register from '../helpers/register.js'
import { validHour } from '../helpers/validators.js'
import componentBehaviourMixin from '../mixins/component-behaviour.js'

class HoursTimeline extends componentBehaviourMixin(window.HTMLElement) {
  // Constructor can't be used reliably in polyfill'ed custom elements

  static get templateName () {
    return 'hours-timeline'
  }

  static get observedAttributes () {
    // Whitelist of attributes for browser to fire `attributeChangedCallback` when changed
    return ['data-hour-begin', 'data-hour-end']
  }

  static get attributesModifier () {
    // List of modifier functions for attributes values
    return { 'data-hour-begin': validHour, 'data-hour-end': validHour }
  }

  static get attributesDefault () {
    // List of default values for attributes
    return { 'data-hour-begin': '9', 'data-hour-end': '17' }
  }

  init () {
    // Add event callbacks
    this.addEventListener('wheel', event => {
      event.preventDefault()
      this.dataset.hourBegin -= event.deltaY / Math.abs(event.deltaY)
      this.dataset.hourEnd += event.deltaY / Math.abs(event.deltaY)
    })
  }

  render () {
    const hourRange = this.dataset.hourEnd - this.dataset.hourBegin

    if (hourRange <= 0) throw new Error('Hour range must be at leat 1')

    const range = document.createRange()
    range.selectNodeContents(this.shadowRoot.querySelector('.timeline'))
    const timelineFragment = document.createDocumentFragment()
    for (const i of Array(hourRange).keys()) {
      timelineFragment.appendChild(document.createElement('hr'))
    }
    range.deleteContents()
    range.insertNode(timelineFragment)
  }
}

register(HoursTimeline)
