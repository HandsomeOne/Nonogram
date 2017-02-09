const webpack = require('webpack')
const { resolve } = require('path')

const isProd = process.env.NODE_ENV === 'production'
module.exports = {
  target: 'web',
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      options: {
        presets: [
          ['es2015', {
            module: false,
          }],
        ],
      },
    }],
  },
  entry: isProd ? './src/index.js' : [
    'webpack-dev-server/client?http://localhost:8080',
    'webpack/hot/only-dev-server',
    './src/index.js',
  ],
  output: {
    path: resolve(__dirname, isProd ? 'docs' : 'test'),
    filename: isProd ? 'nonogram.min.js' : 'nonogram.js',
    library: 'nonogram',
    libraryTarget: 'umd',
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
  devServer: {
    contentBase: resolve(__dirname, 'test'),
    inline: true,
    hot: true,
    port: 8080,
  },
}
