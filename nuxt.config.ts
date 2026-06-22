// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/icon',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/cloudinary',
    'nuxt-security',
  ],
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    useSecure: true,
  },
  security: {
    requestSizeLimiter: {
      maxRequestSizeInBytes: 200000000, // 200MB
      maxUploadFileRequestInBytes: 200000000,
    },
    rateLimiter: {
      tokensPerInterval: 300, // Jumlah request maksimal
      interval: 'minute',      // Jangka waktu (ms, 'second', 'minute', 'hour', 'day')
    },
    csrf: true, // Mengaktifkan perlindungan CSRF
    headers: {
      contentSecurityPolicy: {
        // Tambahkan domain eksternal penyedia gambar Anda di sini
        'img-src': [
          "'self'",
          "data:",
          "blob:",
          "https://res.cloudinary.com"
        ],
        'media-src': [
          "'self'",
          "data:",
          "blob:",
          "https://res.cloudinary.com"
        ],
      },
    },
  },
  css: [
    '~/assets/css/main.css'
  ],
  nitro: {
    experimental: {
      websocket: true
    }
  }
})