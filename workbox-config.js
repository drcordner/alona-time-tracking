module.exports = {
  globDirectory: ".",
  globPatterns: [
    "**/*.{js,css,html,json}",
    "!node_modules/**/*",
    "!workbox-config.js",
    "!test-runner.js",
    "!scripts/**/*"
  ],
  swDest: "sw.js",
  clientsClaim: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /\.(?:js|css)$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-resources"
      }
    }
  ]
}; 