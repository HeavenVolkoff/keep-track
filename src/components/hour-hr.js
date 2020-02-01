import { validHour } from '../helpers/validators.js'
import componentBehaviourMixin from '../helpers/mixins/component-behaviour.js'

export default class HourHR extends componentBehaviourMixin(HTMLElement) {
  // Constructor can't be used reliably in polyfill'ed custom elements

  static get style() {
    return `
    :host:before {
      content: attr(data-hour);
      font-size: 0.75em;
    }

    :host {
      display: flex;
      flex-flow: column;
      align-items: center;
    }

    :host > hr {
      flex: auto;
      width: 1px;
      margin: 0;
      border: none;
      background: black;
    }
    `
  }

  static get template() {
    return `
    <hr />
    `
  }

  static get observedAttributes() {
    // Whitelist of attributes for browser to fire `attributeChangedCallback` when changed
    return ['data-hour']
  }

  static get attributesModifier() {
    // List of modifier functions for attributes values
    return { 'data-hour': validHour }
  }

  static get attributesDefault() {
    // List of default values for attributes
    return { 'data-hour': new Date(Date.now()).getHours() }
  }
}
