import typescript from 'rollup-plugin-typescript'
import bundleWorker from 'rollup-plugin-bundle-worker'

export default {
  input: 'src/index.ts',
  output: {
    file: 'test/nonogram.js',
    format: 'iife',
  },
  name: 'nonogram',
  plugins: [
    typescript({ typescript: require('typescript') }),
    bundleWorker(),
  ],
}
