const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = (env) => {
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
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: './src/html.js',
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: './src/meta',
            to: './',
          },
        ],
      }),
    ],
    devServer: {
      port: 3300,
      host: '0.0.0.0',
      devMiddleware: {
        publicPath: '/',
      },
      setupMiddlewares: (middlewares, devServer) => {
        devServer.app.use((req, res, next) => {
          devServer.middleware.waitUntilValid(() => {
            if (req.url === '/' || req.url.endsWith('.html')) {
              const fs = devServer.middleware.context.outputFileSystem
              const indexHtmlPath = path.join(devServer.middleware.context.compiler.outputPath, 'index.html')

              try {
                let html = fs.readFileSync(indexHtmlPath, 'utf-8')
                html = html.replace(
                  '</head>',
                  `<script>window.env={APP_DEFAULT_LANGUAGE:"en",APP_IS_PRODUCTION:true}</script></head>`,
                )

                res.setHeader('Content-Type', 'text/html')
                res.send(html)
              } catch (err) {
                console.error('Failed to read index.html:', err)
                next(err)
              }
            } else {
              next()
            }
          })
        })

        return middlewares
      },

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
            filename: 'images/[name].[contenthash][ext]',
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
