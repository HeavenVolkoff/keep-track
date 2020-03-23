import componentBehaviourMixin from '../behaviour/component-behaviour.js'

export default class WorkdayTimeline extends componentBehaviourMixin(HTMLElement) {
  // Constructor can't be used reliably in polyfill'ed custom elements

  static get style() {
    return /* css */ `
      :host {
        color: var(--color);
        display: flex;
        contain: content;
        min-width: 4rem;
        min-height: 6rem;
        background: var(--background);
        align-content: center;
        justify-content: center;
      }

      :host > pan-area {
        flex: auto;
      }
      
      :host > .date {
        padding: 1rem;
        display: flex;
        align-content: center;
        flex-direction: column;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.2);
      }
      
      :host .timeline {
        display: flex;
        align-content: center;
        flex-direction: row;
        justify-content: space-around;
      }

      :host .timeline > hour-hr {
        --color: var(--color);
        --line-style: solid;
      }
      
      @media screen and (pointer: fine) {
        :host {
          min-height: 3rem;
        }
      }
    `
  }

  static get template() {
    return /* html */ `
      <div class="date">??/??</div>
      <pan-area touch-action="pan-y">
        <div class="timeline"></div>
      </pan-area>
    `
  }

  static get observedAttributes() {
    // Whitelist of attributes for browser to fire `attributeChangedCallback` when changed
    return ['date']
  }

  static get attributesProperties() {
    // List of modifier functions for attributes values
    return {
      date: {
        get: str => new Date(str),
        set: date => date.toDateString()
      }
    }
  }

  init() {
    if (!this.hasAttribute('date')) {
      this.dataset.date = new Date(Date.now())
    }

    this.addEventListener('error', event => console.warn(event.error))
  }

  render(documentFragment) {
    // Insert date text
    documentFragment.querySelector('.date').textContent = this.dataset.date.toLocaleDateString()

    const timeline = documentFragment.querySelector('.timeline')
    for (const i of Array(24).keys()) {
      const hr = document.createElement('hour-hr')
      hr.setAttribute('data-hour', i)
      timeline.appendChild(hr)
    }
  }
}
