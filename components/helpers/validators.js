export const positiveInteger = val => {
  const hourBegin = Number.parseInt(val)
  if (Number.isNaN(hourBegin) || hourBegin < 0) throw Error('Invalid value')
}