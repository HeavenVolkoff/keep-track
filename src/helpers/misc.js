const uppercaseRegexpMatch = match => match[1].toUpperCase()

export const snakeCaseToCamelCase = name => name.replace(/-([a-zA-Z])/g, uppercaseRegexpMatch)

export const attributeNameToCamelCase = name =>
  snakeCaseToCamelCase(name.toLowerCase().replace(/^(data-)?(.*)/, '$2'))

export const camelCaseToSnakeCase = name => name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

export const nameToDataAttribute = name => `data-${camelCaseToSnakeCase(name)}`

export const hasOwnProperty = Function.prototype.call.bind(Object.prototype.hasOwnProperty)
