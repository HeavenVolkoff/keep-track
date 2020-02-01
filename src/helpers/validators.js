export const positiveInteger = val => {
  const num = Number.parseInt(val)
  if (Number.isNaN(num) || num < 0) throw Error('Invalid value')
  return num
}

export const validHour = val => {
  const hour = positiveInteger(val)
  if (hour < 0 || hour > 23) throw Error('Invalid value')
  return hour
}
