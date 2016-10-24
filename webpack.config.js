const webpack = require('webpack')
const path = require('path')

module.exports = {
  target: 'web',
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel-loader'],
      exclude: /node_modules/,
    }],
  },
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'test'),
    filename: 'nonogram.js',
    library: 'nonogram',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['', '.js'],
  },
}
