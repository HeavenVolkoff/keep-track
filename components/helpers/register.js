export default impl => {
  const WebComponents = window.WebComponents || {}

  const name = impl.templateName
  const native = impl.nativeExtends
  const template = WebComponents.templates[name]

  // Some basic validation
  if (!name || typeof name !== 'string') {
    throw Error('Invalid name for custom element')
  } else if (native && typeof native !== 'string') {
    throw Error(`Invalid native extension for custom element: ${name}`)
  } else if (typeof impl !== 'function') {
    throw Error(`Invalid implementation for custom element: ${name}`)
  } else if (!template || `${template.tagName}`.toLowerCase() !== 'template') {
    throw Error(`Invalid template for custom element: ${name}`)
  }

  const _extends = native ? { extends: native } : {}

  // Element initialization
  const init = () => {
    // ShadyCSS must be initialized before with the template and custom element
    window.ShadyCSS && ShadyCSS.prepareTemplate(template, name, _extends.extends)

    // Register custom element
    customElements.define(name, impl, _extends)
  }

  // Add init to correct listener
  if (WebComponents.waitFor) {
    WebComponents.waitFor(init)
  } else {
    document.addEventListener('WebComponentsReady', init)
  }
}
