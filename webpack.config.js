const path = require('path');

module.exports = {
    entry: './settings.js', // Your entry point
    output: {
        filename: 'bundle.js', // The bundled output file
        path: path.resolve(__dirname, 'dist'), // Output directory
    },
    mode: 'development',
    devtool: 'source-map', // Avoid using eval for compatibility with CSP
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    resolve: {
        fallback: {
            "path": require.resolve("path-browserify") // Ensure compatibility for browser
        }
    }
};
