import { camelCaseToSnakeCase } from './misc.js'

/**
 * Define custom elements, auto generating their names.
 *
 * @param {{
 *  new(): HTMLElement,
 *  prototype: HTMLElement
 * }[]} customElements - List of HTMLElement derivatives.
 */
const _defineCustomElements = customElementDefinitions => {
  for (const customElementDefinition of customElementDefinitions) {
    if (!HTMLElement.isPrototypeOf(customElementDefinition)) {
      console.error(`Class ${customElementDefinition.name} is not a subclass of HTMLElement`)
      continue
    }

    const customElementName = camelCaseToSnakeCase(customElementDefinition.name)

    if (customElementName.indexOf('-') === -1) {
      console.error(
        `Class ${customElementDefinition.name} don't follow custom element naming spec, it must include at least 2 words`
      )
      continue
    }

    customElements.define(customElementName, customElementDefinition)
  }
}

/**
 * Define custom elements, auto generating their names.
 *
 * @param {{
 *  new(): HTMLElement,
 *  prototype: HTMLElement
 * }[]} customElements - List of HTMLElement derivatives.
 */
export default (...customElements) => {
  // Custom element initialization wrapper
  const wrapper = () => _defineCustomElements(customElements)

  if (window.WebComponents) {
    // Wait polyfill initialization
    if (window.WebComponents.waitFor) {
      window.WebComponents.waitFor(wrapper)
    } else {
      document.addEventListener('WebComponentsReady', wrapper)
    }
  } else {
    // Native
    wrapper()
  }
}
