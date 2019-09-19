import componentBehaviourMixin from '../helpers/mixins/component-behaviour.js'
import register from '../helpers/register.js'

class DateHR extends componentBehaviourMixin(window.HTMLElement) {
  // Constructor can't be used reliably in polyfill'ed custom elements

  static get templateName () {
    return 'date-hr'
  }

  static get observedAttributes () {
    // Whitelist of attributes for browser to fire `attributeChangedCallback` when changed
    return []
  }

  static get attributesModifier () {
    // List of modifier functions for attributes values
    return {}
  }

  static get attributesDefault () {
    // List of default values for attributes
    return {}
  }

  init () {}

  render () {}

  finalize () {}
}

register(DateHR)
