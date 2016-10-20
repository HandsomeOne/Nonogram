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
  entry: {
    app: ["./src/index.js"]
  },
  output: {
    path: path.resolve(__dirname, "test"),
    publicPath: "/",
    filename: "nonogram.js",
    library: 'nonogram',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['', '.js'],
  },
}
