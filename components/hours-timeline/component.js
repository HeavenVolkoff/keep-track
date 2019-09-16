import register from '../helpers/register.js'
import { validHour } from '../helpers/validators.js'
import componentBehaviourMixin from '../helpers/mixins/component-behaviour.js'

class HoursTimeline extends componentBehaviourMixin(window.HTMLElement) {
  // Constructor can't be used reliably in polyfill'ed custom elements

  static get templateName () {
    return 'hours-timeline'
  }

  static get observedAttributes () {
    // Whitelist of attributes for browser to fire `attributeChangedCallback` when changed
    return ['data-date', 'data-hour-begin', 'data-hour-end']
  }

  static get attributesModifier () {
    // List of modifier functions for attributes values
    return {
      'data-date': str => new Date(str),
      'data-hour-begin': validHour,
      'data-hour-end': validHour
    }
  }

  static get attributesDefault () {
    // List of default values for attributes
    return {
      'data-date': new Date(Date.now()).toDateString(),
      'data-hour-begin': '9',
      'data-hour-end': '17'
    }
  }

  init () {
    // Add event callbacks
    this.addEventListener('wheel', event => {
      event.preventDefault()
      this.dataset.hourBegin -= event.deltaY / Math.abs(event.deltaY)
      this.dataset.hourEnd += event.deltaY / Math.abs(event.deltaY)
    })

    this.addEventListener('error', event => console.error(event.error))
  }

  render () {
    // Insert date text
    this.shadowRoot.querySelector('.date').textContent = this.dataset.date.toLocaleDateString()

    // Construct hour range
    const hourRange = this.dataset.hourEnd - this.dataset.hourBegin

    if (hourRange <= 0) throw new Error('Hour range must be at leat 1')

    const timeline = this.shadowRoot.querySelector('.timeline')
    for (const i of Array(hourRange).keys()) {
      timeline.appendChild(document.createElement('hr'))
    }
  }
}

register(HoursTimeline)
