import componentBehaviourMixin from '../mixins/component-behaviour.js'

export default class NavBar extends componentBehaviourMixin(HTMLElement) {
  // Constructor can't be used reliably in polyfill'ed custom elements

  static get style() {
    // TODO: Submenus
    // TODO: Responsive
    return /* css */ `
        :host {
            top: 0;
            left: 0;
            position: relative;
        }

        :host,
        :host *,
        ::slotted(*) {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            transform-style: preserve-3d;
        }

        :host,
        :host > header,
        :host > header > nav > ul {
            width: 100%;
        }

        :host > header {
            display: flex;
            background: var(--background);
            align-items: center;
            justify-content: center;
        }

        :host > header > aside {
            color: var(--color);
            display: flex;
            max-width: 10%;
            max-height: 3rem;
            align-items: center;
            justify-content: center;
        }

        :host > header > aside > ::slotted(*) {
            padding: 0 1rem;
            pointer-events: none;
        }

        :host > header > nav{
            flex: auto;
        }

        :host > header > nav > ul{
            display: flex;
            list-style: none;
            justify-content: space-around;
        }

        :host > header > nav > ul > ::slotted(li) {
            color: var(--color);
            padding: 1rem;
            display: inline-block;
            flex-grow: 1;
            text-align: center;
        }

        :host > header > nav > ul > slot::slotted(li[clickable]) {
            cursor: pointer;
        }

        @media(hover: hover) {
            :host > header > nav > ul > ::slotted(li:hover) {
                color: var(--color-on-accent, #000)
            }

            :host > header > nav > ul > ::slotted(li:hover)::before {
                transform: translateY(0) rotate(0deg);
            }

            :host > header > nav > ul > ::slotted(li)::before {
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                content: '';
                z-index: -1;
                position: absolute;
                transform: translateY(-100%);
                background: var(--accent, #ff8000);
                transition: all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
        }
    `
  }

  static get template() {
    return /* html */ `
        <header>
            <aside>
                <slot name="logo"></slot>
            </aside>
            <nav>
                <ul>
                    <slot name="item"></slot>
                </ul>
            </nav>
        </header>
      `
  }

  static get observedAttributes() {
    // Whitelist of attributes for browser to fire `attributeChangedCallback`
    // when changed
    return []
  }

  static get attributesModifier() {
    // List of modifier functions for attributes values
    return {}
  }

  static get attributesDefault() {
    // List of default values for attributes
    return {}
  }

  init() {
    // TODO: Add mutationObserver
    const clickables = this.querySelectorAll('li[clickable]')
    const clickEvent = new window.MouseEvent('click', {
      view: window,
      bubbles: false,
      cancelable: true
    })

    for (const clickable of clickables) {
      clickable.addEventListener('click', event => {
        for (const child of event.target.children) {
          child.dispatchEvent(clickEvent)
        }
      })
    }
  }

  render(documentFragment) {}
}
