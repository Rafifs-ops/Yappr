<script setup>
import { useAuth } from '~/stores/Auth';

const { session } = useAuth();
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full px-4 py-3 bg-[#1a0b2e]/80 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
    <div class="max-w-4xl mx-auto flex justify-between items-center">
      <NuxtLink to="/" class="flex items-center gap-2 group transition-all duration-300">
        <div class="relative overflow-hidden p-1 rounded-lg transition-all">
          <img src="/images/wordmark-yappr.png"
            class="h-6 w-auto object-contain transition-transform duration-300 group-hover:scale-105" alt="Logo">
        </div>
      </NuxtLink>

      <NuxtLink v-slot="{ isExactActive }" to="/profile" class="relative group" v-if="session?.photo">
        <div class="cyber-avatar-ring" :class="{ 'glow-border-purple': isExactActive }">
          <img :src="session?.photo" alt="Profile"
            class="rounded-full w-8 h-8 object-cover aspect-square border border-[#1a0b2e]">
        </div>
        <span
          class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#1a0b2e] animate-pulse"></span>
      </NuxtLink>
      <NuxtLink v-else to="/auth/login"
        class="px-4 py-1.5 rounded-lg border border-purple-500/30 bg-purple-900/200/5 text-purple-600 hover:bg-purple-900/200 hover:text-white transition-all text-xs font-semibold tracking-wider font-orbitron">
        ACCESS PANEL
      </NuxtLink>
    </div>
  </header>
</template>
