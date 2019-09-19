import componentBehaviourMixin from '../helpers/mixins/component-behaviour.js'
import register from '../helpers/register.js'
import { validHour } from '../helpers/validators.js'

class DateHR extends componentBehaviourMixin(window.HTMLElement) {
  // Constructor can't be used reliably in polyfill'ed custom elements

  static get templateName () {
    return 'day-hr'
  }

  static get observedAttributes () {
    // Whitelist of attributes for browser to fire `attributeChangedCallback` when changed
    return ['data-hour']
  }

  static get attributesModifier () {
    // List of modifier functions for attributes values
    return { 'data-hour': validHour }
  }

  static get attributesDefault () {
    // List of default values for attributes
    return { 'data-hour': new Date(Date.now()).getHours() }
  }

  init () {}

  render (documentFragment) {
    // Only render if element is not initializes
    return this.shadowRoot && !this.shadowRoot.hasChildNodes()
  }

  finalize () {}
}

register(DateHR)
