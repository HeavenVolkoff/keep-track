import dataset from './dataset.js'
import { camelCaseToSnakeCase } from './name-op.js'

const resetJobIdSymbol = Symbol("Custom element's repaint job animation frame id")
const renderStateSymbol = Symbol("Custom element's render state identifier")
const resetTemplateSymbol = Symbol("Custom element's reset template reference")
const rollbackStateSymbol = Symbol("Custom element's rollback state identifier")

/**
 * Callback for attribute modifiers.
 *
 * @callback AttributePropertiesGetFn
 * @param {string} value - Attribute value.
 * @throws Must throw an error when value is invalid
 * @returns {*}
 */

/**
 * Callback for attribute modifiers.
 *
 * @callback AttributePropertiesSetFn
 * @param {*} value - Attribute value.
 * @throws Must throw an error when value is invalid
 * @returns {string}
 */

/**
 * Interface for custom component behaviour mixin.
 *
 * @interface ComponentBehaviourInterface
 * @augments HTMLElement
 **/

/**
 * Component css style definition
 *
 * @member {string}
 * @name ComponentBehaviourInterface#style
 * @readonly
 **/

/**
 * Component html template definition
 *
 * @member {string}
 * @name ComponentBehaviourInterface#template
 * @readonly
 **/

/**
 * Component observed attributes
 *
 * @member {string[]}
 * @name ComponentBehaviourInterface#observedAttributes
 * @readonly
 **/

/**
 * Component observed attributes
 *
 * @member {object.<string, {
 *  get?: AttributePropertiesGetFn,
 *  set?: AttributePropertiesSetFn,
 *  value?: *
 * }>}
 * @name ComponentBehaviourInterface#attributesProperties
 * @readonly
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
 * @param {HTMLElement} ElementClass - HTMLElement, or derivative, class that will be extended by our ComponentBehaviour
 * @returns {ComponentBehaviourInterface} HTMLElement, or derivative, class augmented with our ComponentBehaviour logic
 */
export default ElementClass => {
  /**
   * @augments HTMLElement
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
     * @type {object.<string, {
     *  get?: AttributePropertiesGetFn,
     *  set?: AttributePropertiesSetFn,
     *  value?: *
     * }>}
     */
    static get attributesProperties() {
      // List of modifier functions for attributes values
      return {}
    }

    /**
     *  Create an object to proxy the HTMLElement's dataset.
     *  Only attributes defined in `observedAttributes` or `attributesProperties` will be proxied.
     */
    get dataset() {
      return dataset(this)
    }

    /**
     * Component initialization
     *
     * @abstract
     * @returns {undefined}
     */
    init() {}

    /**
     * Component rendering
     *
     * @abstract
     * @param {DocumentFragment} documentFragment - DocumentFragment to be populate
     * @returns {boolean|undefined} - Whether we should update the component's current state with the DocumentFragment
     */
    render(documentFragment) {}

    /**
     * Component reset
     */
    reset() {
      // Reset requestAnimationFrameId
      this[resetJobIdSymbol] = 0

      // Don't have a shadow DOM, nothing to do
      if (!this.shadowRoot) return

      // Patch possible polyfill edge cases
      window.ShadyDOM && window.ShadyDOM.patch(this)

      // Reset element content
      this.shadowRoot.innerHTML = ''

      const template = this[resetTemplateSymbol]
      delete this[resetTemplateSymbol]
      if (template != null) {
        // Polyfill shadow DOM scoped css
        window.ShadyCSS &&
          window.ShadyCSS.prepareTemplate(template, camelCaseToSnakeCase(this.constructor.name))

        // Render new content
        this.shadowRoot.appendChild(document.importNode(template.content, true))

        return true
      }
      return false
    }

    setAttribute(name, value) {
      if (this[renderStateSymbol])
        throw new Error('Element attributes cannot be modified during rendering')
      super.setAttribute(name, value)
    }

    connectedCallback() {
      // ShadyCSS need to be called for every custom element when it is connected
      window.ShadyCSS && window.ShadyCSS.styleElement(this)
      if (!this.shadowRoot && this.isConnected) {
        // Attach shadow DOM to element
        this.attachShadow({ mode: 'open' })

        this.init()

        this[resetJobIdSymbol] = 0
      }

      // Emulate attribute change to trigger initial rendering
      this.attributeChangedCallback(null, false, true)
    }

    disconnectedCallback() {
      // Cancel repaint job
      window.cancelAnimationFrame(this[resetJobIdSymbol])

      // Clear element
      this.reset()

      delete this[resetJobIdSymbol]
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
      // Don't process repeated values or during initialization
      if (oldVal === newVal || !(resetJobIdSymbol in this)) return

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
      let shouldUpdate = false
      this[renderStateSymbol] = true
      try {
        try {
          shouldUpdate = this.render(template.content)
        } finally {
          this[renderStateSymbol] = false
        }
      } catch (error) {
        // Component couldn't do initial redering
        if (attrName == null) throw error

        // Component failed to render, dispatch an error event
        this.dispatchEvent(
          new ErrorEvent('error', {
            error,
            message: `Failed to render element on attribute <${attrName}> change`
          })
        )
        // Attempt to rollback the attribute change that cause the render to fail
        if (this[rollbackStateSymbol]) {
          // We failed rolling back a previous change.
          // As such it is not possible to revert the element back to it's old state.
          // As a result the element's internal state will probably be discrepant with it's visual representation
          throw Error('Failed to restore old state of custom element')
        } else {
          // Set element rollback shared state
          this[rollbackStateSymbol] = true
          // According to spec this change is synchronous and results in a recursive call to `attributeChangedCallback`
          this.setAttribute(attrName, oldVal)
          // On polyfill the above operation isn't synchronous, so we flush to wait
          window.ShadyDOM && window.ShadyDOM.flush()
          return
        }
      } finally {
        // Clear rollback state (Yes, this is executed regardless of the return above)
        this[rollbackStateSymbol] = false
      }

      // Register template to be repainted
      if (typeof shouldUpdate === 'undefined' || shouldUpdate) {
        this[resetTemplateSymbol] = template
        // Enqueue reset execution to next animation frame if necessary
        if (this[resetJobIdSymbol] === 0)
          this[resetJobIdSymbol] = window.requestAnimationFrame(() => this.reset())
      }
    }
  }
}
