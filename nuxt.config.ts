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
    'nuxt-nodemailer'
  ],
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    useSecure: true,
  },
  nodemailer: {
    from: '"Yappr" <finjoyfinancetracker@gmail.com>',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
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