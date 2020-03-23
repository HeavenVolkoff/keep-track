const MULTI_ACTIONS = new Set(['pan-x', 'pan-y', 'pinch-zoom'])
const SINGLE_ACTIONS = new Set(['auto', 'none', 'manipulation'])

/**
 * Normalize browser capabilities.
 *
 * @param {string} touchActions - touch-action definition
 * @returns {string} Which pan capabilities are enabled
 */
export const normalizeTouchActions = touchActions => {
  touchActions = touchActions.trim()

  if (SINGLE_ACTIONS.has(touchActions)) return touchActions

  const actions = new Set(touchActions.split(' ').filter(Boolean))

  // Normalize synonyms
  if (actions.delete('pan-up') || actions.delete('pan-down')) actions.add('pan-y')
  if (actions.delete('pan-left') || actions.delete('pan-right')) actions.add('pan-x')

  const result = [...actions].join(' ')

  // Validate that there are no extra supported
  for (const action of MULTI_ACTIONS) actions.delete(action)
  if (actions.size > 0) throw new Error(`Invalid touch-actions: ${result}`)

  return result
}

/**
 * Calculate which capabilities are enabled given a touch-action definition.
 *
 * @param {string} touchActions - touch-action definition
 * @returns {Set.<string>} Which pan capabilities are enabled
 */
export default touchActions => {
  const browserCapabilities = new Set(normalizeTouchActions(touchActions).split(' '))

  if (browserCapabilities.has('none')) return new Set(MULTI_ACTIONS)

  const capabilities = new Set()

  if (browserCapabilities.has('auto') || browserCapabilities.has('manipulation'))
    return capabilities

  for (const action of MULTI_ACTIONS) {
    if (browserCapabilities.has(action)) continue
    capabilities.add(action)
  }

  return capabilities
}
