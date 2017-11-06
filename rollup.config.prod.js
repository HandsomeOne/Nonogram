import typescript from 'rollup-plugin-typescript'
import bundleWorker from 'rollup-plugin-bundle-worker'
import babel from 'rollup-plugin-babel'
import uglify from 'rollup-plugin-uglify'

export default {
  input: 'src/index.ts',
  output: {
    file: 'docs/nonogram.min.js',
    format: 'iife',
  },
  name: 'nonogram',
  plugins: [
    typescript({ typescript: require('typescript') }),
    bundleWorker(),
    babel(),
    uglify(),
  ],
}
