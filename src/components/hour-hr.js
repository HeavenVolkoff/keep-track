import { validHour } from '../helpers/validators.js'
import componentBehaviourMixin from '../behaviour/component-behaviour.js'

export default class HourHR extends componentBehaviourMixin(HTMLElement) {
  // Constructor can't be used reliably in polyfill'ed custom elements

  static get style() {
    return /* css */ `
      :host:before {
        color: var(--color);
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
        width: 0;
        margin: 0;
        border: none;
        border-left-width: 2px;
        border-left-color: var(--color);
        border-left-style: var(--line-style);
      }
    `
  }

  static get template() {
    return /* html */ `
      <hr />
    `
  }

  static get observedAttributes() {
    // Whitelist of attributes for browser to fire `attributeChangedCallback` when changed
    return ['hour']
  }

  static get attributesProperties() {
    // List of modifier functions for attributes values
    return {
      hour: validHour
    }
  }

  init() {
    if (!this.hasAttribute('hour')) {
      this.dataset.hour = new Date(Date.now()).getHours()
    }

    this.addEventListener('error', event => console.warn(event.error))
  }
}
