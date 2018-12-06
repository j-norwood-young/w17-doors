const HtmlWebpackPlugin = require('html-webpack-plugin'); //installed via npm
const webpack = require('webpack'); //to access built-in plugins

module.exports = {
    mode: 'development',
    watch: true,
    watchOptions: {
        ignored: ['node_modules']
    },
    module: {
        rules: [{
            test: /\.scss$/,
            use: [
                "style-loader", // creates style nodes from JS strings
                "css-loader", // translates CSS into CommonJS
                "sass-loader" // compiles Sass to CSS, using Node Sass by default
            ]
        },
        {
            test: /\.svg$/,
            loader: 'svg-inline-loader'
        },
        {
            test: /\.pug$/,
            loader: 'pug-loader'
        },
    ]},
    plugins: [
        new HtmlWebpackPlugin({template: './src/index.html'})
    ]
};
