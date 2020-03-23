import { snakeCaseToCamelCase } from './name-op.js'

const normalizeProp = val => (typeof val === 'function' ? val : null)

const normalizeAttrProps = attrProps => {
  const normalized = {}
  normalized.get = normalizeProp(attrProps)
  if (normalized.get == null) {
    normalized.get = normalizeProp(attrProps.get)
    normalized.set = normalizeProp(attrProps.set)
  }
  return normalized
}

const createDataset = component => {
  const cls = component.constructor
  const attrsProps = cls.attributesProperties || {}
  const descriptor = Object.create(null)

  for (const attr of Array.prototype.concat.call(
    Object.keys(attrsProps),
    cls.observedAttributes || []
  )) {
    const normalizeAttr = snakeCaseToCamelCase(attr)
    if (normalizeAttr in descriptor) continue

    const attrProps = normalizeAttrProps(attrsProps[attr])

    descriptor[normalizeAttr] = {
      set: val => component.setAttribute(attr, attrProps.set == null ? val : attrProps.set(val)),
      get: () => {
        const rawValue = component.getAttribute(attr)
        return attrProps.get == null ? rawValue : attrProps.get(rawValue)
      },
      enumerable: true,
      configurable: false
    }
  }

  return Object.freeze(Object.create(null, descriptor))
}

const datasetSymbol = Symbol('Custom dataset')
export default component => {
  if (!(datasetSymbol in component)) component[datasetSymbol] = createDataset(component)
  return component[datasetSymbol]
}
