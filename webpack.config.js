const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlInlineCssWebpackPlugin =
  require('html-inline-css-webpack-plugin').default;
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    mode: isProd ? 'production' : 'development',
    entry: './src/index.ts',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg|woff2?|ttf|eot)$/i,
          type: 'asset/inline',
        },
        {
          test: /\.json$/,
          type: 'json',
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
      publicPath: '',
    },
    devServer: {
      static: path.resolve(__dirname, 'dist'),
      open: true,
      hot: true,
      port: 3000,
    },
    plugins: [
      new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
      new MiniCssExtractPlugin(),
      new HtmlWebpackPlugin({
        template: 'src/index.html',
        inject: 'body',
      }),
      ...(isProd
        ? [new HtmlInlineCssWebpackPlugin(), new HtmlInlineScriptPlugin()]
        : []),
    ],
  };
};
