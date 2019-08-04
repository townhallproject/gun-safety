require('dotenv').config();

// Dynamic Script and Style Tags
const HTMLPlugin = require('html-webpack-plugin');

// Makes a separate CSS bundle
const ExtractPlugin = require('extract-text-webpack-plugin');

const CopyWebpackPlugin = require('copy-webpack-plugin');

const { EnvironmentPlugin, DefinePlugin } = require('webpack');

const production = process.NODE_ENV;

const plugins = [
  new HTMLPlugin({
    template: `${__dirname}/src/index.html`,
  }),
  new ExtractPlugin('bundle.[hash].css'),
  new EnvironmentPlugin(['NODE_ENV']),

  new DefinePlugin({
    NODE_ENV: JSON.stringify(process.env.NODE_ENV),
    __API_URL__: JSON.stringify(process.env.API_URL),
    __AUTH_URL__: JSON.stringify(process.env.AUTH_URL),
    __DEBUG__: JSON.stringify(!production),
  }),
  new CopyWebpackPlugin([
    {
      flatten: true,
      from: 'src/data',
      to: 'data',
    },
    {
      flatten: true,
      from: 'src/assets/images',
      to: 'assets',
    },
  ]),
];

module.exports = {

  plugins,

  // Load this and everythning it cares about
  entry: `${__dirname}/src/main.js`,

  devtool: 'source-map',

  // Stick it into the "path" folder with that file name
  output: {
    filename: 'bundle.[hash].js',
    path: `${__dirname}/build`,
  },

  module: {
    rules: [
      // If it's a .js file not in node_modules, use the babel-loader
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      // If it's a .scss file
      {
        test: /\.scss$/,
        loader: ExtractPlugin.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
              },
            },
            'resolve-url-loader',
            {
              loader: 'sass-loader',
              options: {
                includePaths: [`${__dirname}/src/style`],
                sourceMap: true,
              },
            },
          ],
        }),
      },
      {
        test: /\.(woff|woff2|ttf|eot|glyph|\.svg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              name: 'font/[name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.(jpg|jpeg|gif|png|tiff|svg)$/,
        exclude: /\.glyph.svg/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 6000,
              name: 'image/[name].[ext]',
            },
          },
        ],
      },

    ],
  },
  devServer: {
    historyApiFallback: true,
  },

};
