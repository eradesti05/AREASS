module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      if (!webpackConfig.resolve) {
        webpackConfig.resolve = {};
      }
      if (!webpackConfig.resolve.fallback) {
        webpackConfig.resolve.fallback = {};
      }
      return webpackConfig;
    },
  },
};
