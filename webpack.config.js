const webpack = require('webpack')
const { resolve } = require('path')

const isProd = process.env.NODE_ENV === 'production'
module.exports = {
  target: 'web',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: resolve(__dirname, './src/worker'),
        use: [
          {
            loader: 'awesome-typescript-loader',
            options: {
              useBabel: true,
            }
          }
        ]
      },
      {
        test: /worker\.ts$/,
        use: [
          {
            loader: 'worker-loader',
            options: {
              inline: true,
              fallback: false,
            }
          },
          {
            loader: 'awesome-typescript-loader',
            options: {
              useBabel: true,
              configFileName: './src/worker/tsconfig.json',
            }
          }
        ]
      }
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
}
