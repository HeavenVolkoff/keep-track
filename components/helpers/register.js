;(window => {
  'use strict'

  // Reference to current script element
  const currentScript = document.currentScript

  // Load data passed to script element about the custom element to be registered
  const elementName = currentScript.dataset.elementName
  const elementImpl = window.WebComponents.registry[elementName]
  const elementExtends = currentScript.dataset.elementExtends
    ? { extends: currentScript.dataset.elementExtends }
    : {}

  // Some basic validation
  if (typeof elementImpl !== 'function') {
    throw Error(`Implementation for element ${elementName} is not available in window`)
  } else if (!elementImpl.template || elementImpl.template.tagName !== 'TEMPLATE') {
    throw Error(
      `Implementation for element ${elementName} doesn't contain a reference to a template element`
    )
  }

  // Element initialization
  const init = () => {
    // ShadyCSS must be initialized before with the template and custom element
    window.ShadyCSS &&
      window.ShadyCSS.prepareTemplate(elementImpl.template, elementName, elementExtends.extends)

    // Register custom element
    window.customElements.define('hours-timeline', elementImpl, elementExtends)
  }

  // Add init to correct listener
  ;(window.WebComponents &&
    window.WebComponents.waitFor &&
    (window.WebComponents.waitFor(init) || true)) ||
    document.addEventListener('WebComponentsReady', init)
})(typeof window !== 'undefined' ? window : this)
