import { attributeNameToCamelCase, hasOwnProperty } from '../misc.js'

const repaintQueue = new Map()
const datasetSymbol = Symbol("Custom element's dataset")
const rollbackSymbol = Symbol("Custom element's attribute rollback control")
const initializedAttrs = Symbol("Custom element's attributes default initialization flag")
const updateCustomElements = _ => {
  if (repaintQueue.size > 0) {
    for (const [element, documentFragment] of repaintQueue) {
      element.reset(documentFragment)
    }
    repaintQueue.clear()
  }

  requestAnimationFrame(updateCustomElements)
}

// Start loop for updating custom elements
requestAnimationFrame(updateCustomElements)

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
 * Component finalization
 *
 * @function
 * @name ComponentBehaviourInterface#finalize
 * @abstract
 * @returns {undefined}
 */

/**
 * Define a HTMLElement derivative class with custom behaviour.
 *
 * @param {{
 *  new(): HTMLElement,
 *  prototype: HTMLElement
 * }} ElementClass - HTMLElement, or derivative, class that will be extended by our ComponentBehaviour
 * @returns {{
 *  readonly templateName: string,
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
     * @type {object.<string, attributeModifierCallback>}
     */
    static get attributesModifier () {
      // List of modifier functions for attributes values
      return {}
    }

    /**
     * Default values for attributes.
     * NOTICE: Will be applied at element connection to any attribute without a prior value
     *
     * @type {object.<string, string>}
     */
    static get attributesDefault () {
      return {}
    }

    /**
     *  Create an object to proxy the HTMLElement's dataset.
     *  All attributes defined in `observedAttributes` will be defined as getters, their values
     *    will be automatically parsed with the functions in `attributesModifier`.
     *  Extra attributes will not be exposed here, but can be accessed in they raw form with
     *    `super.dataset`.
     */
    get dataset () {
      // Instantiate dataset if it isn't available yet
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
                    set: val => (super.dataset[dataAttrName] = val),
                    get: () => {
                      const rawValue = super.dataset[dataAttrName]
                      const modifier = this.constructor.attributesModifier[attrName]
                      // @todo: Cache modifier result
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
    init () {}

    /**
     * Component reset
     *
     * @param {DocumentFragment|null} documentFragment - Populated DocumentFragment to replace the component's current state
     * @returns {undefined}
     */
    reset (documentFragment) {
      if (!this.shadowRoot) return

      const range = document.createRange()
      range.selectNodeContents(this.shadowRoot)
      range.deleteContents()

      if (documentFragment != null) {
        range.insertNode(documentFragment)
      }
    }

    /**
     * Component rendering
     *
     * @abstract
     * @param {DocumentFragment} documentFragment - Empty DocumentFragment to be populate
     * @returns {boolean|undefined} - Whether we should update the component's current state with the DocumentFragment
     */
    render (documentFragment) {}

    /**
     * Component finalization
     *
     * @abstract
     * @returns {undefined}
     */
    finalize () {}

    connectedCallback () {
      // ShadyCSS need to be called for every custom element when it is connected
      window.ShadyCSS && ShadyCSS.styleElement(this)
      if (!this.shadowRoot && this.isConnected) {
        // Attach shadow DOM to element
        this.attachShadow({ mode: 'open' })

        this.init()

        this[initializedAttrs] = () =>
          Object.keys(this.constructor.attributesDefault).every(attr =>
            hasOwnProperty(this.attributes, attr)
          )
        for (const [key, value] of Object.entries(this.constructor.attributesDefault)) {
          if (this.getAttribute(key) === null) this.setAttribute(key, value)
        }
        this[initializedAttrs] = () => true
      }
    }

    disconnectedCallback () {
      this.reset(null)
      this.attachShadow({ mode: 'closed' })
      this[initializedAttrs] = () => false
      this.finalize()
    }

    attributeChangedCallback (attrName, oldVal, newVal) {
      // Don't process repeated values
      if (oldVal === newVal) return
      // Wait until element has initialized all attributes
      if (!this[initializedAttrs]()) return
      // Initialize rollback control if necessary
      if (!(this[rollbackSymbol] instanceof Set)) this[rollbackSymbol] = new Set()

      let shouldUpdate = true
      const rollback = this[rollbackSymbol]
      const fragment = document.createDocumentFragment()

      // Initialize fragment with fresh content from element's template
      fragment.appendChild(
        document.importNode(WebComponents.templates[this.constructor.templateName].content, true)
      )

      try {
        shouldUpdate = this.render(fragment)
      } catch (error) {
        this.dispatchEvent(new ErrorEvent('error', { message: 'Failed to render element', error }))
        if (rollback.has(attrName)) {
          // We couldn't revert the element back to it's old state.
          // As a result the element's internal data will probably be discrepant with it's visual representation
          throw Error('Failed to restore old state of custom element')
        } else {
          rollback.add(attrName)
          // This change is synchronous and results in a recursive call to `attributeChangedCallback`
          this.setAttribute(attrName, oldVal)
          return
        }
      } finally {
        rollback.delete(attrName)
      }

      // Add rendered fragment to repaint queue
      if (typeof shouldUpdate === 'undefined' || shouldUpdate) repaintQueue.set(this, fragment)
    }
  }
}
