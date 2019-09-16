import { hasOwnProperty, nameToDataAttribute } from '../helpers/misc.js'

const proxiedDataset = Symbol('ProxiedDataset')

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
 * @interface ComponentBehaviour
 * @extends {HTMLElement}
 **/

/**
 * Component initialization
 *
 * @function
 * @name ComponentBehaviour#init
 * @abstract
 * @returns {undefined}
 **/

/**
 * Component rendering
 *
 * @function
 * @name ComponentBehaviour#render
 * @abstract
 * @returns {undefined}
 **/

/**
 * Component finalization
 *
 * @function
 * @name ComponentBehaviour#finalize
 * @abstract
 * @returns {undefined}
 */

/**
 * Define a HTMLElement derivative class with custom behaviour.
 *
 * @param {{new(): HTMLElement, prototype: HTMLElement}} ElementClass
 * @returns {{
 *  readonly templateName: string,
 *  readonly observedAttributes: string[],
 *  readonly attributesModifier: Object.<string, attributeModifierCallback>,
 *  readonly attributesDefault: Object.<string, string>,
 *  new(): ComponentBehaviour,
 *  prototype: ComponentBehaviour
 * }}
 */
export default ElementClass => {
  /**
   * @extends HTMLElement
   * @implements ComponentBehaviour
   */
  return class ComponentBehaviour extends ElementClass {
    // Constructor can't be used reliably in polyfill'ed custom elements

    /**
     * The component global identifier, a.k.a: Tag name.
     * Used for loading the template data into the Shadow DOM.
     *
     * @type {string}
     */
    static get templateName () {
      throw Error('No template name available for this component')
    }

    /**
     * Whitelist of attributes to be observed for changes.
     *
     * @type {string[]}
     */
    static get observedAttributes () {
      return []
    }

    /**
     * Modifier functions to be applied for validation and conversion of attribute values.
     * NOTICE: The functions must raise an error if the attribute value is invalid
     *
     * @type: {Object.<string, attributeModifierCallback>}
     */
    static get attributesModifier () {
      // List of modifier functions for attributes values
      return {}
    }

    /**
     * Default values for attributes.
     * NOTICE: Will be applied at element connection to any attribute without a prior value
     *
     * @type: {Object.<string, string>}
     */
    static get attributesDefault () {
      return {}
    }

    /**
     * @ignore
     */
    get dataset () {
      if (typeof this[proxiedDataset] === 'undefined') {
        this[proxiedDataset] = new Proxy(super.dataset, {
          get: (target, prop) => {
            const dataAttr = nameToDataAttribute(prop)
            const rawValue = target[prop]

            if (rawValue == null) return null

            if (hasOwnProperty(this.constructor.attributesModifier, dataAttr)) {
              return this.constructor.attributesModifier[dataAttr](rawValue)
            }

            return rawValue
          }
        })
      }

      return this[proxiedDataset]
    }

    /**
     * Component initialization
     * @abstract
     */
    init () {}

    /**
     * Component rendering
     * @abstract
     */
    render () {}

    // TODO: Implement a reset

    /**
     * Component finalization
     * @abstract
     */
    finalize () {}

    connectedCallback () {
      // ShadyCSS need to be called for every custom element when it is connected
      window.ShadyCSS && window.ShadyCSS.styleElement(this)
      if (!this.shadowRoot && this.isConnected) {
        // Attach shadow DOM to element
        this.attachShadow({ mode: 'open' })
        // Load template content into element shadow DOM
        this.shadowRoot.appendChild(
          document.importNode(
            window.WebComponents.templates[this.constructor.templateName].content,
            true
          )
        )

        this.init()

        for (const [key, value] of Object.entries(this.constructor.attributesDefault)) {
          if (this.getAttribute(key) === null) this.setAttribute(key, value)
        }

        // TODO: Validate element's initial state
      }
    }

    disconnectedCallback () {
      this.finalize()
    }

    attributeChangedCallback (attrName, oldVal, newVal) {
      let rollback = false

      if (!hasOwnProperty(this.attributeChangedCallback, '_roll_back')) {
        this.attributeChangedCallback._roll_back = new Set()
      }

      if (
        !Object.keys(this.constructor.attributesDefault).every(attr =>
          hasOwnProperty(this.attributes, attr)
        )
      ) {
        // Await until element has initialized all attributes
        return
      }

      // Don't process repeated values
      if (oldVal === newVal) return

      try {
        // TODO: Call reset
        this.render()
      } catch (error) {
        console.error(error)
        if (this.attributeChangedCallback._roll_back.has(attrName)) {
          throw Error('Failed to restore state')
        } else {
          rollback = true
          this.attributeChangedCallback._roll_back.add(attrName)
          this.setAttribute(attrName, oldVal)
        }
      } finally {
        if (!rollback) this.attributeChangedCallback._roll_back.delete(attrName)
      }
    }
  }
}
