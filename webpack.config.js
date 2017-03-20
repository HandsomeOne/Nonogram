const webpack = require('webpack')
const { resolve } = require('path')

const isProd = process.env.NODE_ENV === 'production'
module.exports = [{
  target: 'web',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          { loader: 'awesome-typescript-loader',
            options: {
              useBabel: true,
            }
          }
        ]
      },
    ],
  },
  entry: isProd ? './src/index.ts' : [
    'webpack-dev-server/client?http://localhost:8080',
    'webpack/hot/only-dev-server',
    './src/index.ts',
  ],
  output: {
    path: resolve(__dirname, isProd ? 'docs' : 'test'),
    filename: isProd ? 'nonogram.min.js' : 'nonogram.js',
    library: 'nonogram',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: isProd ? [] : [
    new webpack.HotModuleReplacementPlugin(),
  ],
  devServer: {
    contentBase: resolve(__dirname, 'test'),
    inline: true,
    hot: true,
    port: 8080,
  },
}, {
  target: 'webworker',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          { loader: 'awesome-typescript-loader',
            options: {
              useBabel: true,
              configFileName: './src/worker/tsconfig.json',
            }
          }
        ]
      },
    ],
  },
  entry: isProd ? './src/worker/worker.ts' : [
    'webpack-dev-server/client?http://localhost:8080',
    'webpack/hot/only-dev-server',
    './src/worker/worker.ts',
  ],
  output: {
    path: resolve(__dirname, isProd ? 'docs' : 'test'),
    filename: 'worker.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: isProd ? [] : [
    new webpack.HotModuleReplacementPlugin(),
  ],
  devServer: {
    contentBase: resolve(__dirname, 'test'),
    inline: true,
    hot: true,
    port: 8080,
  },
}]
