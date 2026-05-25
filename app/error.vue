<script setup>
// Nuxt 3 otomatis mengirimkan object error ke komponen ini
const props = defineProps({
  error: Object
})

// Fungsi untuk menghapus state error dan kembali ke halaman utama
const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-[#FFF0F5] px-4 font-sans">
    <div class="bg-[#1a0b2e]/80 backdrop-blur-md p-8 md:p-12 rounded-3xl shadow-xl max-w-lg w-full text-center border-t-8 border-purple-600">

      <div class="flex justify-center mb-6 text-purple-600">
        <Icon name="streamline-ultimate:alert-octagon-1-bold" class="w-20 h-20 animate-bounce" />
      </div>

      <h1 class="text-7xl font-extrabold text-white mb-2 tracking-tighter">
        {{ error?.statusCode || 'Oops!' }}
      </h1>

      <h2 class="text-2xl font-bold text-gray-700 mb-4">
        {{ error?.statusCode === 404 ? 'Halaman Tidak Ditemukan' : 'Terjadi Kesalahan Server' }}
      </h2>

      <div
        class="bg-gray-100 p-4 rounded-xl text-sm border border-purple-800/50 mb-8 overflow-hidden text-left shadow-inner">
        <p class="text-gray-500 font-semibold mb-1">Detail Masalah:</p>
        <p class="text-red-500 break-words font-mono">
          {{ error?.statusMessage || error?.message || 'Terjadi gangguan yang tidak diketahui pada sistem.' }}
        </p>
      </div>

      <button @click="handleError"
        class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 active:scale-95">
        <Icon name="streamline-ultimate:house-4-bold" class="w-5 h-5" />
        <span>Kembali ke Beranda</span>
      </button>

    </div>
  </div>
</template>