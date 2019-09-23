// Must be valid ES5 for compatibility
;(function () {
  'use strict'

  var url, urlParts
  var previousScript = document.currentScript.previousElementSibling

  if (!(previousScript instanceof HTMLScriptElement)) {
    throw new Error('There is no previous script element')
  }

  if (window.System == null) {
    throw new Error('SystemJS is not defined')
  }

  try {
    url = '.' + new URL(previousScript.src).pathname
  } catch (_) {
    url = previousScript.src
  }

  urlParts = url.split('.')
  urlParts[urlParts.length - 2] += '-system'
  url = urlParts.join('.')

  window.System.import().catch(console.error)
})()
