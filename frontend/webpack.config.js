const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const { getIfUtils, removeEmpty } = require('webpack-config-utils')

module.exports = (env) => {
  const { ifNotProduction } = getIfUtils(env)

  return {
    mode: env.production ? 'production' : 'development',
    entry: {
      main: './src/index.js',
    },
    output: {
      publicPath: '/',
      path: path.resolve(__dirname, 'public'),
      filename: '[name].[fullhash].js',
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
        template: './src/html.js',
      }),
    ],
    devServer: {
      port: 3000,
      host: '0.0.0.0',
      publicPath: '/',
      hot: true,
      historyApiFallback: { disableDotRule: true },
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          enforce: 'pre',
          use: ['source-map-loader'],
        },
        {
          test: /manifest.json$/i,
          type: 'asset/resource',
          generator: {
            filename: '[name][ext]',
          },
        },
        {
          test: /robots.txt|favicon.ico$/i,
          type: 'asset/resource',
          generator: {
            filename: '[name][ext]',
          },
        },
        {
          test: /\.(png|svg|jpe?g|gif)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'images/[name][ext]',
          },
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
