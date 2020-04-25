module.exports = {
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
