const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const { getIfUtils, removeEmpty } = require('webpack-config-utils')

module.exports = ({ mode }) => {
  const { ifNotProduction } = getIfUtils(mode)

  return {
    mode,
    entry: {
      main: './src/index.js',
    },
    output: {
      publicPath: '/',
      path: path.resolve(__dirname, 'public'),
      filename: '[name].[hash].js',
    },
    optimization: {
      runtimeChunk: {
        name: (entrypoint) => `runtime~${entrypoint.name}`,
      },
      splitChunks: {
        chunks: 'all',
      },
    },
    resolve: removeEmpty({
      alias: ifNotProduction({
        'react-dom': '@hot-loader/react-dom',
      }),
    }),
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        publicPath: 'public',
        template: './src/html.js',
      }),
    ],
    devServer: {
      port: 3000,
      host: '0.0.0.0',
      publicPath: '/',
      hot: true,
      historyApiFallback: true,
    },
    module: {
      rules: [
        {
          test: /manifest.json$/i,
          type: 'javascript/auto',
          use: [
            {
              loader: 'file-loader',
              options: { name: '[name].[ext]' },
            },
          ],
        },
        {
          // put any images imported into the /public/images folder
          test: /robots.txt|favicon.ico$/i,
          use: [
            {
              loader: 'file-loader',
              options: { name: '[name].[ext]' },
            },
          ],
        },
        {
          // put any images imported into the /public/images folder
          test: /\.(png|svg|jpe?g|gif)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
                outputPath: './images',
              },
            },
          ],
        },
        {
          test: /\.m?js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              // cache transpilation results to speed up build
              cacheDirectory: true,
            },
          },
        },
      ],
    },
  }
}
