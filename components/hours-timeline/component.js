import register from '../helpers/register.js'
import { validHour } from '../helpers/validators.js'
import { processAttributes, setAttributesDefault } from '../helpers/process_attributes.js'

class HoursTimeline extends window.HTMLElement {
  // Constructor can't be used reliably in polyfill'ed custom elements

  static get templateName () {
    return 'hours-timeline'
  }

  static get observedAttributes () {
    // Whitelist of attributes for browser to fire `attributeChangedCallback` when changed
    return ['hour-begin', 'hour-end']
  }

  static get attributesModifier () {
    // List of modifier functions for attributes values
    return { 'hour-begin': validHour, 'hour-end': validHour }
  }

  static get attributesDefault () {
    // List of default values for attributes
    return { 'hour-begin': 9, 'hour-end': 17 }
  }

  initShadow () {
    // Attach shadow DOM to element
    this.attachShadow({ mode: 'open' })
    // Load template content into element shadow DOM
    this.shadowRoot.appendChild(
      document.importNode(
        window.WebComponents.templates[this.constructor.templateName].content,
        true
      )
    )

    // Initialize properties
    this.hourEnd = 0
    this.hourBegin = 0

    setAttributesDefault(this, this.constructor.attributesDefault)
  }

  render () {
    // TODO: make changes in DOM here
  }

  connectedCallback () {
    // ShadyCSS need to be called for every custom element when it is connected
    window.ShadyCSS && window.ShadyCSS.styleElement(this)
    if (!this.shadowRoot) this.initShadow()
  }

  disconnectedCallback () {
    // TODO: Element clean-up
  }

  attributeChangedCallback (attrName, oldVal, newVal) {
    if (processAttributes(this, this.constructor.attributesModifier, attrName, oldVal, newVal)) {
      this.render()
    }
  }
}

register(HoursTimeline)
