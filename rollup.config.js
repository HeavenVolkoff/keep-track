import { promises as fs } from 'fs'
import { dirname, extname, join, parse, relative } from 'path'

import glob from 'fast-glob'
import copy from 'rollup-plugin-copy'

const toCopy = ['index.html', 'LICENSE', 'components/systemjs-component-loader.js']
const toCopyExt = ['.css', '.js', '.map']
const isProduction = process.env.NODE_ENV === 'production'
const libsToProcess = ['node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js']

const convertDirToGlob = async dir => {
  try {
    if (!(await fs.lstat(dir)).isDirectory()) return dir
  } catch {
    return dir
  }

  return join(dir, '**', '*')
}

const readPackageJson = dir =>
  fs.readFile(join(dir, 'package.json'), { encoding: 'utf8' }).then(JSON.parse)

const resolveDependencyFiles = async dependency => {
  const packageJson = await readPackageJson(dependency)
  return (await Promise.all(
    [packageJson.main || '', packageJson.browser || '', ...(packageJson.files || [])]
      .map(filePath => join(dependency, filePath))
      .map(filePath => convertDirToGlob(filePath).then(glob))
  ))
    .flatMap(f => f)
    .filter(filePath => toCopyExt.includes(extname(filePath)) && !libsToProcess.includes(filePath))
}

const resolveNodeModulesFiles = async () => {
  const dependencies = Object.keys((await readPackageJson('.')).dependencies).map(dependency =>
    join('node_modules', dependency)
  )
  return [
    ...new Set((await Promise.all(dependencies.map(resolveDependencyFiles))).flatMap(f => f))
  ]
}

export default (async () => {
  const [
    componentsJSPaths,
    componentsHTMLPaths,
    toCopyNodeModules,
    { terser }
  ] = await Promise.all([
    glob('components/*/component.*'),
    resolveNodeModulesFiles(),
    (isProduction && import('rollup-plugin-terser')) || { terser: () => false }
  ])

  return [
    {
      input: componentsJSPaths.reduce((obj, filePath) => {
        const path = parse(filePath)
        obj[relative('components', join(path.dir, path.name))] = filePath
        return obj
      }, {}),
      output: [
        // ES module version, for modern browsers
        {
          dir: 'dist/components',
          format: 'es',
          indent: false,
          sourcemap: true,
          preferConst: true
        },
        // SystemJS version, for older browsers
        {
          dir: 'dist/components',
          indent: false,
          format: 'system',
          sourcemap: true,
          entryFileNames: '[name]-system.js'
        }
      ],
      plugins: [
        copy({
          targets: [...toCopy, ...componentsHTMLPaths, ...toCopyNodeModules].map(path => ({
            src: path,
            dest: dirname(join('dist', path))
          })),
          copyOnce: true
        }),
        terser({
          ecma: 8,
          compress: { module: true }
        })
      ],
      treeshake: true,
      experimentalOptimizeChunks: true
    },
    ...libsToProcess.map(filePath => ({
      input: filePath,
      output: [
        {
          file: join('dist', filePath),
          strict: true,
          format: 'es',
          sourcemap: true
        }
      ],
      plugins: [terser({ ecma: 8 })],
      treeshake: false
    }))
  ]
})()
