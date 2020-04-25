module.exports = {
    publicPath: process.env.ENV === 'production'
        ? '/covid19/'
        : '/',
    configureWebpack: {
        module: {
            rules: [
                {
                    test: /\.sass$/,
                    use: [
                        "vue-style-loader",
                        {
                            loader: "sass-loader",
                            options: {
                                indentedSyntax: true,
                                sassOptions: {
                                    indentedSyntax: true
                                }
                            }
                        },
                        "css-loader"
                    ]
                }
            ]
        }
    }
}
