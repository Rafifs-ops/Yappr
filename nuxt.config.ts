// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/cloudinary',
    'nuxt-security',
  ],
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/images/logo-yappr.png' }
      ]
    }
  },
  runtimeConfig: {
    authSecret: process.env.AUTH_SECRET,
    jwtSecret: process.env.JWT_SECRET,
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
    emailUser: process.env.EMAIL_USER,
    emailPass: process.env.EMAIL_PASS,
    databaseUrl: process.env.DATABASE_URL,
    tursoDatabaseUrl: process.env.TURSO_DATABASE_URL,
    tursoAuthToken: process.env.TURSO_AUTH_TOKEN,
    nodeEnv: process.env.NODE_ENV,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
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
    'bootstrap-icons/font/bootstrap-icons.css',
    '~/assets/css/main.css'
  ],
  nitro: {
    experimental: {
      websocket: true
    }
  },
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'sanitize-html',
        '@tiptap/vue-3',
        '@tiptap/starter-kit',
        '@tiptap/extension-mention',
        'tippy.js',
      ]
    }
  }
})