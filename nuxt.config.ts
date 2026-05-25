// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/icon',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/cloudinary',
    'nuxt-security'
  ],
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    useSecure: true,
  },
  security: {
    requestSizeLimiter: {
      maxRequestSizeInBytes: 104857600, // 100MB untuk mengakomodasi upload video base64
      maxUploadFileRequestInBytes: 104857600,
    },
    rateLimiter: {
      tokensPerInterval: 50, // Jumlah request maksimal
      interval: 'hour',      // Jangka waktu (ms, 'second', 'minute', 'hour', 'day')
    },
    csrf: true, // Mengaktifkan perlindungan CSRF
    headers: {
      contentSecurityPolicy: {
        // Tambahkan domain eksternal penyedia gambar Anda di sini
        'img-src': [
          "'self'",
          "data:",
          "https://res.cloudinary.com"
        ],
      },
    },
  },
  css: [
    'quill/dist/quill.snow.css', // Pastikan CSS ini dimuat global
    '~/assets/css/main.css'
  ]
})