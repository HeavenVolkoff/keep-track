export const setAttributesDefault = (element, defaults) => {
  for (const [key, value] of Object.entries(defaults)) {
    if (!element.getAttribute(key)) element.setAttribute(key, value)
  }
}

const camelCase = match => match[1].toUpperCase()

export const processAttributes = (element, modifiers, attrName, oldVal, newVal) => {
  // Don't process repeated values
  if (oldVal === newVal) return false

  // data-* attributes are already saved in .dataset, and shouldn't be reflect as class properties
  if (attrName.startsWith('data-')) return true

  // Normalize property names to camelCase
  const prop = attrName.replace(/-([a-z])/g, camelCase)

  // Check if we have a class property to reflect this attribute value
  if (!Object.prototype.hasOwnProperty.call(element, prop)) {
    if (newVal !== null) {
      console.warn(`Data was assigned to non reflected attribute: ${attrName}`)
    }

    // Non reflected attribute don't trigger change
    return false
  }

  // Modify attribute value accordingly
  if (modifiers[attrName]) {
    try {
      newVal = modifiers[attrName](newVal)
    } catch (err) {
      // If modifiers throws an error reset attribute to old value
      console.error(err)
      element.setAttribute(attrName, oldVal)
      return false
    }
  }

  // Don't process repeated values
  if (element[prop] === newVal) return false

  element[prop] = newVal

  return true
}
