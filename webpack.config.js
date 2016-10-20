const webpack = require('webpack')

module.exports = {
  target: 'web',
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel-loader'],
      exclude: /node_modules/,
    }],
  },
  output: {
    library: 'nonogram',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['', '.js'],
  },
}
