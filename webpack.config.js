 const path = require('path');

 module.exports = {
   target: 'node', 
   entry: './src/vs_plugin.js', 
   output: {
     filename: 'vs_plugin.js',
     path: path.resolve(__dirname, 'dist'),
   },
   optimization: {
        minimize: false
    }
   // Additional configuration goes here
 };