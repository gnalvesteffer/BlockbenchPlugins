const path = require('path');
var ZipPlugin = require('zip-webpack-plugin');

module.exports = {
    mode: 'development',
    target: 'node',
    entry: './src/vs_plugin.js',
    output: {
        filename: 'vs_plugin.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new ZipPlugin({
            filename: 'UnpackMe_vs_plugin.zip'
        })
    ],
    optimization: {
        minimize: false
    },
    // Additional configuration goes here
};