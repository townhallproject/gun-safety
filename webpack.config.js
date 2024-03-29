require('dotenv').config();

// Dynamic Script and Style Tags
const HTMLPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const CopyWebpackPlugin = require('copy-webpack-plugin');

const { EnvironmentPlugin, DefinePlugin } = require('webpack');

const production = process.NODE_ENV;

const basePlugins = [
  new HTMLPlugin({
    template: `${__dirname}/src/index.html`,
  }),
  new MiniCssExtractPlugin({
    chunkFilename: '[id].css',
    filename: '[name].css',
  }),
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
      from: 'src/CNAME',
    },
    {
      flatten: true,
      from: 'src/assets/images',
      to: 'assets',
    },
  ]),
];

const plugins = process.env.NODE_ENV === 'production' ? [
  ...basePlugins,
] : basePlugins;
module.exports = {
  mode: process.env.NODE_ENV,
  optimization: {
    minimizer: [new TerserPlugin()],
  },
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
        exclude: /node_modules/,
        loader: 'babel-loader',
        test: /\.js$/,
      },
      // If it's a .scss file
      {
        test: /\.scss$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
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
