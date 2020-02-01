import { hasOwnProperty, camelCaseToSnakeCase, attributeNameToCamelCase } from '../misc.js'

const datasetSymbol = Symbol("Custom element's dataset")
const rollbackSymbol = Symbol("Custom element's attribute rollback control")
const initializedSymbol = Symbol("Custom element's initialization flag")
const repaintJobIdSymbol = Symbol("Custom element's repaint job animation frame id")
const resetTemplateSymbol = Symbol("Custom element's reset template reference")

/**
 * Callback for attribute modifiers.
 *
 * @callback attributeModifierCallback
 * @param {string} value - Attribute value.
 * @throws Must throw an error when value is invalid
 * @returns {*}
 */

/**
 * Interface for custom component behaviour mixin.
 *
 * @interface ComponentBehaviourInterface
 * @augments {HTMLElement}
 **/

/**
 * Component initialization
 *
 * @function
 * @name ComponentBehaviourInterface#init
 * @abstract
 * @returns {undefined}
 **/

/**
 * Component reset
 *
 * @function
 * @name ComponentBehaviourInterface#reset
 * @param {DocumentFragment|null} documentFragment
 * @returns {undefined}
 **/

/**
 * Component rendering
 *
 * @function
 * @name ComponentBehaviourInterface#render
 * @abstract
 * @param {DocumentFragment} documentFragment
 * @returns {boolean|undefined}
 **/

/**
 * Define a HTMLElement derivative class with custom behaviour.
 *
 * @param {{
 *  new(): HTMLElement,
 *  prototype: HTMLElement
 * }} ElementClass - HTMLElement, or derivative, class that will be extended by our ComponentBehaviour
 * @returns {{
 *  readonly style: string,
 *  readonly template: string,
 *  readonly observedAttributes: string[],
 *  readonly attributesModifier: Object.<string, attributeModifierCallback>,
 *  readonly attributesDefault: Object.<string, string>,
 *  new(): ComponentBehaviour,
 *  prototype: ComponentBehaviour
 * }} HTMLElement, or derivative, class augmented with our ComponentBehaviour logic
 */
export default ElementClass => {
  /**
   * @augments {HTMLElement}
   * @implements {ComponentBehaviourInterface}
   */
  return class ComponentBehaviour extends ElementClass {
    // Constructor can't be used reliably in polyfill'ed custom elements

    /**
     * Component CSS style.
     *
     * @type {string}
     */
    static get style() {
      return ''
    }

    /**
     * Component HTML template.
     *
     * @type {string}
     */
    static get template() {
      throw Error('No template available for this component')
    }

    /**
     * Whitelist of attributes to be observed for changes.
     *
     * @type {string[]}
     */
    static get observedAttributes() {
      return []
    }

    /**
     * Modifier functions to be applied for validation and conversion of attribute values.
     * NOTICE: The functions must raise an error if the attribute value is invalid
     *
     * @type {object.<string, attributeModifierCallback>}
     */
    static get attributesModifier() {
      // List of modifier functions for attributes values
      return {}
    }

    /**
     * Default values for attributes.
     * NOTICE: Will be applied at element connection to any attribute without a prior value
     *
     * @type {object.<string, string>}
     */
    static get attributesDefault() {
      return {}
    }

    /**
     *  Create an object to proxy the HTMLElement's dataset.
     *  All attributes defined in `observedAttributes` will be defined as getters, their values
     *    will be automatically parsed with the functions in `attributesModifier`.
     *  Extra attributes will not be exposed here, but can be accessed in they raw form with
     *    `super.dataset`.
     */
    get dataset() {
      // Initialize dataset if it isn't available yet
      if (this[datasetSymbol] == null) {
        this[datasetSymbol] = Object.create(
          null,
          Object.fromEntries(
            this.constructor.observedAttributes
              .filter(attrName => attrName.startsWith('data-'))
              .map(attrName => {
                // Dataset uses a different naming scheme to access the attribute values:
                // data-attr-name => dataset.attrName
                const dataAttrName = attributeNameToCamelCase(attrName)
                return [
                  dataAttrName,
                  {
                    // ShadyDOM doesn't register attributes set through dataset.
                    // So we redirect this to setAttribute
                    set: val => this.setAttribute(attrName, val),
                    get: () => {
                      const rawValue = super.dataset[dataAttrName]
                      const modifier = this.constructor.attributesModifier[attrName]
                      // @todo: Cache modifier result?
                      return modifier == null ? rawValue : modifier(rawValue)
                    },
                    enumerable: true,
                    configurable: false
                  }
                ]
              })
          )
        )
      }

      return this[datasetSymbol]
    }

    /**
     * Component initialization
     *
     * @abstract
     * @returns {undefined}
     */
    init() {}

    /**
     * Component reset
     *
     * @param {HTMLTemplateElement|null} documentFragment - Populated DocumentFragment to replace the component's current state
     * @returns {undefined}
     */
    reset(template) {
      // Don't have a shadow DOM, nothing to do
      if (!this.shadowRoot) return

      // Patch possible polyfill edge cases
      window.ShadyDOM && window.ShadyDOM.patch(this)

      // Reset element content
      this.shadowRoot.innerHTML = ''

      if (template != null) {
        // Polyfill template shadow DOM css
        window.ShadyCSS &&
          window.ShadyCSS.prepareTemplate(template, camelCaseToSnakeCase(this.constructor.name))

        // Render new content
        this.shadowRoot.appendChild(document.importNode(template.content, true))
      }
    }

    /**
     * Component rendering
     *
     * @abstract
     * @param {DocumentFragment} documentFragment - DocumentFragment to be populate
     * @returns {boolean|undefined} - Whether we should update the component's current state with the DocumentFragment
     */
    render(documentFragment) {}

    connectedCallback() {
      // ShadyCSS need to be called for every custom element when it is connected
      window.ShadyCSS && window.ShadyCSS.styleElement(this)
      if (!this.shadowRoot && this.isConnected) {
        // Attach shadow DOM to element
        this.attachShadow({ mode: 'open' })

        this.init()

        // Initialize components default attribute values
        for (const [key, value] of Object.entries(this.constructor.attributesDefault)) {
          if (this.getAttribute(key) === null) this.setAttribute(key, value)
        }
      }

      // Inform that the element is fully initiallized
      this[initializedSymbol] = true

      // Emulate attribute change to trigger initial rendering
      this.attributeChangedCallback(null, false, true)

      // Initialize repaint job
      const repaintJob = () => {
        const resetTemplate = this[resetTemplateSymbol]
        if (resetTemplate != null) {
          delete this[resetTemplateSymbol]
          this.reset(resetTemplate)
        }
        this[repaintJobIdSymbol] = window.requestAnimationFrame(repaintJob)
      }
      this[repaintJobIdSymbol] = window.requestAnimationFrame(repaintJob)
    }

    disconnectedCallback() {
      // Cancel repaint job
      window.cancelAnimationFrame(this[repaintJobIdSymbol])

      // Un-initialize
      delete this[initializedSymbol]

      // Clear element
      this.reset(null)
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
      // Don't process repeated values
      if (oldVal === newVal) return
      // Wait until element has initialized all attributes
      if (!(initializedSymbol in this)) return

      // Initialize new template with fresh content from component's HTML template
      const template = document.createElement('template')
      template.innerHTML = this.constructor.template.trim()

      // Collapse any template embedded style into a single style combined with the component's style
      const style = document.createElement('style')
      style.textContent = (
        Array.from(template.content.querySelectorAll('style'))
          .map(style => template.content.removeChild(style).innerText)
          .join('\n') +
        '\n' +
        this.constructor.style
      ).trim()
      template.content.prepend(style)

      // Attempt to execute component render method
      let shouldUpdate = true
      try {
        shouldUpdate = this.render(template.content)
      } catch (error) {
        // Component couldn't do initial redering
        if (attrName == null) throw Error('Failed to do initial element rendering')

        // Component failed to render, dispatch an error event
        this.dispatchEvent(
          new ErrorEvent('error', {
            error,
            message: `Failed to render element on attribute <${attrName}> change`
          })
        )
        // Attempt to rollback the attribute change that cause the render to fail
        if (rollbackSymbol in this) {
          // We failed rolling back a previous change.
          // As such it is not possible to revert the element back to it's old state.
          // As a result the element's internal state will probably be discrepant with it's visual representation
          throw Error('Failed to restore old state of custom element')
        } else {
          // Set element rollback shared state
          this[rollbackSymbol] = true
          // According to spec this change is synchronous and results in a recursive call to `attributeChangedCallback`
          this.setAttribute(attrName, oldVal)
          // On polyfill the above operation isn't synchronous, so we flush to wait
          window.ShadyDOM && window.ShadyDOM.flush()
          return
        }
      } finally {
        // Clear rollback state (Yes, this is executed regardless of the return above)
        delete this[rollbackSymbol]
      }

      // Register template to be repainted
      if (typeof shouldUpdate === 'undefined' || shouldUpdate) this[resetTemplateSymbol] = template
    }
  }
}
