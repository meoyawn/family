module.exports = {
  future: {
    webpack5: false,
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && isServer) {
      require('./scripts/nextgen')
    }

    return config
  }
}
