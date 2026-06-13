<script setup>
const { data: notifications } = useFetch('/api/notifications', {
  key: 'notifications-data',
  lazy: true
});

// Hitung jumlah notifikasi yang belum dibaca (isRead === false)
const unreadCount = computed(() => {
  return notifications.value?.filter(n => !n.isRead).length || 0;
});
</script>

<template>
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
    <nav
      class="flex justify-around items-center p-2.5 bg-[#1a0b2e]/80 backdrop-blur-md/80 backdrop-blur-md border border-purple-800/40 rounded-2xl shadow-[0_12px_30px_rgba(148,163,184,0.15)]">
      <NuxtLink v-slot="{ isExactActive }" to="/" class="flex flex-col items-center group">
        <div class="p-2.5 rounded-xl transition-all duration-300 relative"
          :class="isExactActive ? 'text-purple-600 bg-purple-900/200/10 shadow-[0_0_10px_rgba(2,132,199,0.08)]' : 'text-purple-400 hover:text-purple-100 hover:bg-purple-900/30/50'">
          <Icon name="streamline-ultimate:house-4-bold" size="20" />
          <span v-if="isExactActive"
            class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-900/200 rounded-full shadow-[0_0_6px_rgba(2,132,199,0.6)] animate-pulse"></span>
        </div>
      </NuxtLink>
      <NuxtLink v-slot="{ isExactActive }" to="/create" class="flex flex-col items-center group">
        <div class="p-2.5 rounded-xl transition-all duration-300 relative"
          :class="isExactActive ? 'text-purple-600 bg-purple-900/200/10 shadow-[0_0_10px_rgba(2,132,199,0.08)]' : 'text-purple-400 hover:text-purple-100 hover:bg-purple-900/30/50'">
          <Icon name="streamline-ultimate:add-circle-bold-bold" size="20" />
          <span v-if="isExactActive"
            class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-900/200 rounded-full shadow-[0_0_6px_rgba(2,132,199,0.6)] animate-pulse"></span>
        </div>
      </NuxtLink>
      <NuxtLink v-slot="{ isExactActive }" to="/search" class="flex flex-col items-center group">
        <div class="p-2.5 rounded-xl transition-all duration-300 relative"
          :class="isExactActive ? 'text-purple-600 bg-purple-900/200/10 shadow-[0_0_10px_rgba(2,132,199,0.08)]' : 'text-purple-400 hover:text-purple-100 hover:bg-purple-900/30/50'">
          <Icon name="streamline-ultimate:search-circle-alternate-bold" size="20" />
          <span v-if="isExactActive"
            class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-900/200 rounded-full shadow-[0_0_6px_rgba(2,132,199,0.6)] animate-pulse"></span>
        </div>
      </NuxtLink>
      <NuxtLink v-slot="{ isExactActive }" to="/notification" class="flex flex-col items-center group">
        <div class="p-2.5 rounded-xl transition-all duration-300 relative"
          :class="isExactActive ? 'text-purple-600 bg-purple-900/200/10 shadow-[0_0_10px_rgba(2,132,199,0.08)]' : 'text-purple-400 hover:text-purple-100 hover:bg-purple-900/30/50'">
          <div class="relative">
            <Icon name="streamline-ultimate:alert-bell-notification-2-bold" size="20" />
            <span v-if="unreadCount > 0"
              class="absolute -top-1.5 -right-1.5 bg-fuchsia-600 text-white text-[9px] font-bold px-1.5 py-[1px] rounded-full min-w-[16px] text-center border border-[#1a0b2e] shadow-[0_0_8px_rgba(236,72,153,0.6)] z-10 font-mono">
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
          </div>
          <span v-if="isExactActive"
            class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-900/200 rounded-full shadow-[0_0_6px_rgba(2,132,199,0.6)] animate-pulse"></span>
        </div>
      </NuxtLink>
      <NuxtLink v-slot="{ isExactActive }" to="/chats" class="flex flex-col items-center group">
        <div class="p-2.5 rounded-xl transition-all duration-300 relative"
          :class="isExactActive ? 'text-purple-600 bg-purple-900/200/10 shadow-[0_0_10px_rgba(2,132,199,0.08)]' : 'text-purple-400 hover:text-purple-100 hover:bg-purple-900/30/50'">
          <Icon name="streamline-ultimate:messages-bubble-square-typing-bold" size="20" />
          <span v-if="isExactActive"
            class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-900/200 rounded-full shadow-[0_0_6px_rgba(2,132,199,0.6)] animate-pulse"></span>
        </div>
      </NuxtLink>
    </nav>
  </div>
</template>
