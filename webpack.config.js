module.exports = {
  target: 'web',
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader',
      query: {
        presets: ['latest'],
      },
    }],
  },
  entry: './src/index.js',
  output: {
    path: './test',
    filename: 'nonogram.js',
    library: 'nonogram',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['', '.js'],
  },
}
