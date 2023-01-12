const {
    override,
    addWebpackPlugin,
    setWebpackPublicPath
} = require("customize-cra");
const BundleTracker = require("webpack-bundle-tracker")
const process = require("process")

const isProd = process.env.NODE_ENV === 'production'

module.exports = override(
    isProd ? addWebpackPlugin(new BundleTracker({filename: './webpack-stats.json'})) : null,
    isProd ? setWebpackPublicPath("/dj-static/assets/frontend/") : null
);
