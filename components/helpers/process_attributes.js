export const setAttributesDefault = (element, defaults) => {
  for (const [key, value] of Object.entries(defaults)) {
    if (!element.getAttribute(key)) element.setAttribute(key, value)
  }
}

const camelCase = match => match[1].toUpperCase()

export const processAttributes = (element, modifiers, attrName, oldVal, newVal) => {
  let modified = true

  // TODO: Custom logic for data attributes, they should always render when value updates

  if (oldVal !== newVal) {
    const attr = attrName.replace(/-([a-z])/g, camelCase)

    if (Object.prototype.hasOwnProperty.call(element, attr)) {
      if (modifiers[attrName]) {
        try {
          newVal = modifiers[attrName](newVal)
        } catch (err) {
          console.error(err)
          newVal = oldVal
          modified = false
        }
      }

      element[attr] = newVal
    } else {
      console.warn(`Unknown data attribute: ${attrName}, being accessed`)
      modified = false
    }
  } else {
    modified = false
  }

  return modified
}
