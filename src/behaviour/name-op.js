const uppercaseRegexpMatch = match => match[1].toUpperCase()

export const snakeCaseToCamelCase = name => name.replace(/-([a-zA-Z])/g, uppercaseRegexpMatch)

export const camelCaseToSnakeCase = name => name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()