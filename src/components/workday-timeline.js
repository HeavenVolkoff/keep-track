import { validHour } from '../helpers/validators.js'
import componentBehaviourMixin from '../mixins/component-behaviour.js'

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
    
    :host > .date {
      padding: 1rem;
      display: flex;
      align-content: center;
      flex-direction: column;
      justify-content: center;
    }
    
    :host > .timeline {
      flex: auto;
      display: flex;
      align-content: center;
      flex-direction: row;
      justify-content: space-around;
    }

    :host > .timeline > hour-hr {
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
    <div class="timeline"></div>
    `
  }

  static get observedAttributes() {
    // Whitelist of attributes for browser to fire `attributeChangedCallback` when changed
    return ['data-date', 'data-hour-begin', 'data-hour-end']
  }

  static get attributesModifier() {
    // List of modifier functions for attributes values
    return {
      'data-date': str => new Date(str),
      'data-hour-begin': validHour,
      'data-hour-end': validHour
    }
  }

  static get attributesDefault() {
    // List of default values for attributes
    return {
      'data-date': new Date(Date.now()).toDateString(),
      'data-hour-begin': '9',
      'data-hour-end': '17'
    }
  }

  init() {
    // Add event callbacks
    this.addEventListener('wheel', event => {
      event.preventDefault()
      this.dataset.hourBegin -= event.deltaY / Math.abs(event.deltaY)
      this.dataset.hourEnd += event.deltaY / Math.abs(event.deltaY)
    })

    this.addEventListener('error', event => console.warn(event.error))
  }

  render(documentFragment) {
    // Insert date text
    documentFragment.querySelector('.date').textContent = this.dataset.date.toLocaleDateString()

    // Construct hour range
    const hourRange = this.dataset.hourEnd - this.dataset.hourBegin

    if (hourRange < 2) throw new Error('Hour range must be at least 2')

    const timeline = documentFragment.querySelector('.timeline')
    for (const i of Array(hourRange + 1).keys()) {
      const hr = document.createElement('hour-hr')
      hr.setAttribute('data-hour', i)
      timeline.appendChild(hr)
    }
  }
}
