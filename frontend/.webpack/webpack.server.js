const { merge } = require('webpack-merge')
const baseConfig = require('./webpack.config')

module.exports = merge(baseConfig, {
  devServer: {
    port: 3000,
    host: '0.0.0.0',
    devMiddleware: { publicPath: '/' },
    hot: true,
    historyApiFallback: { disableDotRule: true },
  },
})
