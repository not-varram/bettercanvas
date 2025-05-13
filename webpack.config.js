const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    content: './src/content/index-simple.ts',
    popup: './src/popup/index-simple.ts',
    background: './src/background/index-simple.ts'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'js/[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "public/manifest.json", to: "." },
        { from: "public/icon", to: "icon" },
        { from: "public/css", to: "css" },
        { from: "public/html", to: "html" },
        { from: "public/_locales", to: "_locales" }
      ],
    }),
  ],
};
