/* eslint-env node */

/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://quasar.dev/quasar-cli/quasar-conf-js

const path = require('path');

module.exports = function (ctx) {
    return {
    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://quasar.dev/quasar-cli/cli-documentation/boot-files
        boot: [
            'axios',
            'socket',
            'filters',
            'vuelidate',
            'autologin'
            // 'notify-defaults'
        ],

        // https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-css
        css: [
            'app.sass'
        ],

        // https://github.com/quasarframework/quasar/tree/dev/extras
        extras: [
            // 'ionicons-v4',
            'mdi-v4',
            'fontawesome-v5',
            // 'eva-icons',
            // 'themify',
            // 'line-awesome',
            // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

            'roboto-font', // optional, you are not bound to it
            'material-icons' // optional, you are not bound to it
        ],

        // https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-framework
        framework: {
            config: {
                dark: true,
                loadingBar: {
                    position: 'bottom',
                    color: 'accent',
                    size: '22px',
                    'skip-hijack': true
                },
                notify: {
                    position: 'top',
                    timeout: 5000,
                    textColor: 'white',
                    progress: true,
                    actions: [
                        // { icon: 'dismiss' }
                        { label: 'Dismiss', color: 'white', handler: () => { /* ... */ } }
                    ]
                }
            },
            iconSet: 'material-icons', // Quasar icon set
            lang: 'en-us', // Quasar language pack

            // Possible values for "all":
            // * 'auto' - Auto-import needed Quasar components & directives
            //            (slightly higher compile time; next to minimum bundle size; most convenient)
            // * false  - Manually specify what to import
            //            (fastest compile time; minimum bundle size; most tedious)
            // * true   - Import everything from Quasar
            //            (not treeshaking Quasar; biggest bundle size; convenient)
            all: 'auto',

            components: [],
            directives: [],

            // Quasar plugins
            plugins: [
                'Loading',
                'LoadingBar',
                'Notify',
                'Cookies',
                'AppVisibility'
            ]
        },

        // https://quasar.dev/quasar-cli/cli-documentation/supporting-ie
        supportIE: false,

        // https://quasar.dev/quasar-cli/cli-documentation/supporting-ts
        supportTS: false,

        // Full list of options: https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-build
        build: {
            vueRouterMode: 'history', // available values: 'hash', 'history'

            distDir: '../server/public',

            env: {
                generateAPIURL: function(hostname) {
                    return `https://${hostname}:3030`;
                },
                isProduction: ctx.dev ? false : true
                // API: `https://${location.hostname}:3132`
            // } : {
            //     API: `https://${location.hostname}:3132`
            },

            // rtl: false, // https://quasar.dev/options/rtl-support
            // showProgress: false,
            // gzip: true,
            // analyze: true,

            // Options below are automatically set depending on the env, set them if you want to override
            // preloadChunks: false,
            // extractCSS: false,

            // https://quasar.dev/quasar-cli/cli-documentation/handling-webpack
            extendWebpack (cfg) {
                cfg.resolve.alias = {
                    ...cfg.resolve.alias,
                    '@': path.resolve(__dirname, './src')
                };

                cfg.module.rules.push({
                    enforce: 'pre',
                    test: /\.(js|vue)$/,
                    loader: 'eslint-loader',
                    exclude: /node_modules/,
                    options: {
                        formatter: require('eslint').CLIEngine.getFormatter('stylish')
                    }
                });
            },
            uglifyOptions: {
                // Suppress console logs on build but not dev server
                compress: { drop_console: ctx.dev ? false : true }
            }
        },

        // Full list of options: https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-devServer
        devServer: {
            https: true,
            port: 8182,
            open: true // opens browser window automatically
        },

        // animations: 'all', // --- includes all animations
        // https://quasar.dev/options/animations
        animations: [
            'fadeIn',
            'fadeOut'
        ],

        // https://quasar.dev/quasar-cli/developing-ssr/configuring-ssr
        ssr: {
            pwa: false
        },

        // https://quasar.dev/quasar-cli/developing-pwa/configuring-pwa
        pwa: {
            workboxPluginMode: 'GenerateSW', // 'GenerateSW' or 'InjectManifest'
            workboxOptions: {}, // only for GenerateSW
            manifest: {
                name: 'Acxiom S4 Manager',

                short_name: 'Acxiom S4 Manager',
                description: 'S4 manager website',
                display: 'standalone',
                orientation: 'portrait',

                background_color: '#ffffff',

                theme_color: '#027be3',
                icons: [
                    {
                        src: 'statics/icons/icon-128x128.png',
                        sizes: '128x128',
                        type: 'image/png'
                    },
                    {
                        src: 'statics/icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'statics/icons/icon-256x256.png',
                        sizes: '256x256',
                        type: 'image/png'
                    },
                    {
                        src: 'statics/icons/icon-384x384.png',
                        sizes: '384x384',
                        type: 'image/png'
                    },
                    {
                        src: 'statics/icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        },

        // Full list of options: https://quasar.dev/quasar-cli/developing-cordova-apps/configuring-cordova
        cordova: {
            // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
            id: 'com.acxiom.solvitur4.s4manager'
        },

        // Full list of options: https://quasar.dev/quasar-cli/developing-capacitor-apps/configuring-capacitor
        capacitor: {
            hideSplashscreen: true
        },

        // Full list of options: https://quasar.dev/quasar-cli/developing-electron-apps/configuring-electron
        electron: {
            bundler: 'packager', // 'packager' or 'builder'

            packager: {
                // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options

                // OS X / Mac App Store
                // appBundleId: '',
                // appCategoryType: '',
                // osxSign: '',
                // protocol: 'myapp://path',

                // Windows only
                // win32metadata: { ... }
            },

            builder: {
                // https://www.electron.build/configuration/configuration

                appId: 'acxioms4manager-client'
            },

            // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
            nodeIntegration: true,

            extendWebpack (/* cfg */) {
                // do something with Electron main process Webpack cfg
                // chainWebpack also available besides this extendWebpack
            }
        }
    }
}
