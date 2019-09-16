const uppercaseRegexpMatch = match => match[1].toUpperCase()

export const attributeNameToCamelCase = name =>
  name.replace(/^(data-)?(.*)/, '$2').replace(/-([a-z])/g, uppercaseRegexpMatch)

export const nameToDataAttribute = camelCase =>
  `data-${camelCase.replace(/([A-Z])/g, '-$1').toLowerCase()}`

export const hasOwnProperty = Function.prototype.call.bind(Object.prototype.hasOwnProperty)
