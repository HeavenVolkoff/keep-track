import { validHour } from '../helpers/validators.js'
import componentBehaviourMixin from '../mixins/component-behaviour.js'

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
