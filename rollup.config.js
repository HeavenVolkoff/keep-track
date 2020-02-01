import { promises as fs } from 'fs'
import { dirname, extname, join } from 'path'

import glob from 'fast-glob'
import copy from 'rollup-plugin-copy'

/**
 * Files that will be copied to build
 */
const toCopy = ['index.html', 'LICENSE']

/**
 * Libs that should be minified before copy
 */
const libsToMinify = ['node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js']

/**
 * File extensions allowed to be copied from node_modules
 */
const allowedExtensions = ['.css', '.js', '.map']

// Define what kind of build to produce
const isProduction = process.env.NODE_ENV === 'production'

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
  return (
    await Promise.all(
      [packageJson.main || '', packageJson.browser || '', ...(packageJson.files || [])]
        .map(filePath => join(dependency, filePath))
        .map(filePath => convertDirToGlob(filePath).then(glob))
    )
  )
    .flatMap(f => f)
    .filter(
      filePath => allowedExtensions.includes(extname(filePath)) && !libsToMinify.includes(filePath)
    )
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
  const [toCopyNodeModules, { terser }] = await Promise.all([
    resolveNodeModulesFiles(),
    (isProduction && import('rollup-plugin-terser')) || { terser: () => false }
  ])

  return [
    {
      input: 'src/app.js',
      output: [
        // ES module version, for modern browsers
        {
          dir: 'dist/src',
          format: 'es',
          indent: !isProduction,
          plugins: [
            terser({
              module: true,
              warnings: true,
              toplevel: true,
              keep_fnames: true,
              keep_classnames: true
            })
          ],
          safari10: true,
          sourcemap: true,
          preferConst: true
        },
        // SystemJS version, for older browsers
        {
          dir: 'dist/src',
          indent: !isProduction,
          format: 'iife',
          plugins: [
            terser({ warnings: true, toplevel: true, keep_fnames: true, keep_classnames: true })
          ],
          safari10: true,
          sourcemap: true,
          entryFileNames: '[name]-fallback.js'
        }
      ],
      plugins: [
        copy({
          targets: [...toCopy, ...toCopyNodeModules].map(path => ({
            src: path,
            dest: dirname(join('dist', path))
          })),
          copyOnce: true
        })
      ],
      treeshake: true,
      experimentalOptimizeChunks: true
    },
    ...libsToMinify.map(filePath => ({
      input: filePath,
      output: [
        {
          file: join('dist', filePath),
          strict: true,
          format: 'es',
          sourcemap: true
        }
      ],
      plugins: [terser()],
      treeshake: false
    }))
  ]
})()
