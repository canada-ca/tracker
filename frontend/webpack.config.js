const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackRootPlugin = require('html-webpack-root-plugin')
const HtmlWebpackInlineSVGPlugin = require('html-webpack-inline-svg-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const { getIfUtils, removeEmpty } = require('webpack-config-utils')

module.exports = ({ mode }) => {
  const { ifProduction, ifNotProduction } = getIfUtils(mode)

  return {
    mode,
    output: {
      filename: 'bundle.js',
    },
    resolve: removeEmpty({
      alias: ifNotProduction({
        'react-dom': '@hot-loader/react-dom',
      }),
    }),
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin(),
      new HtmlWebpackRootPlugin(),
      new HtmlWebpackInlineSVGPlugin(),
    ],
    devServer: {
      port: 3000,
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        },
        {
          test: /\.(png|svg|jpe?g|gif)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                outputPath: 'images',
              },
            },
          ],
        },
      ],
    },
  }
}
