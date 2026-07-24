<script setup lang="ts">
import { useToast } from '~/composables/useToast';

const { toasts, remove } = useToast();

const getIconName = (type: string) => {
  switch (type) {
    case 'success':
      return 'bi-check-circle-fill';
    case 'error':
      return 'bi-x-circle-fill';
    case 'warning':
      return 'bi-exclamation-triangle-fill';
    case 'info':
    default:
      return 'bi-info-circle-fill';
  }
};

const getThemeClasses = (type: string) => {
  switch (type) {
    case 'success':
      return {
        border: 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
        bg: 'bg-[#062319]/90',
        text: 'text-emerald-300',
        iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        bar: 'bg-emerald-400'
      };
    case 'error':
      return {
        border: 'border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
        bg: 'bg-[#290815]/90',
        text: 'text-rose-300',
        iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
        bar: 'bg-rose-500'
      };
    case 'warning':
      return {
        border: 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
        bg: 'bg-[#261b07]/90',
        text: 'text-amber-300',
        iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        bar: 'bg-amber-400'
      };
    case 'info':
    default:
      return {
        border: 'border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
        bg: 'bg-[#18092b]/90',
        text: 'text-purple-300',
        iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
        bar: 'bg-purple-400'
      };
  }
};
</script>

<template>
  <div
    class="fixed top-4 right-4 sm:right-6 z-[99999] flex flex-col gap-3 w-full max-w-xs sm:max-w-sm pointer-events-none px-3 sm:px-0">
    <TransitionGroup name="toast">
      <div v-for="item in toasts" :key="item.id"
        class="pointer-events-auto relative overflow-hidden rounded-2xl border backdrop-blur-xl p-4 transition-all duration-300 group shadow-2xl"
        :class="[getThemeClasses(item.type).bg, getThemeClasses(item.type).border]">

        <!-- Cyber accent corner -->
        <div class="absolute top-0 left-0 w-8 h-[1px] bg-gradient-to-r from-white/40 to-transparent"></div>
        <div class="absolute top-0 left-0 h-8 w-[1px] bg-gradient-to-b from-white/40 to-transparent"></div>

        <div class="flex items-start gap-3">
          <!-- Icon -->
          <div
            class="flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center shadow-inner mt-0.5"
            :class="getThemeClasses(item.type).iconBg">
            <i :class="['bi', getIconName(item.type), 'text-lg']"></i>
          </div>

          <!-- Content -->
          <div class="flex-1 pr-4">
            <h4 v-if="item.title" class="font-orbitron font-bold text-xs tracking-wider text-white mb-0.5">
              {{ item.title }}
            </h4>
            <p class="font-mono text-xs leading-relaxed" :class="getThemeClasses(item.type).text">
              {{ item.message }}
            </p>
          </div>

          <!-- Close button -->
          <button @click="remove(item.id)"
            class="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 flex-shrink-0 flex items-center justify-center">
            <i class="bi bi-x-lg text-xs"></i>
          </button>
        </div>

        <!-- Progress Bar -->
        <div v-if="item.duration > 0" class="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/10">
          <div class="h-full transition-all ease-linear"
            :class="getThemeClasses(item.type).bar"
            :style="{ animation: `toast-progress ${item.duration}ms linear forwards` }">
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.92);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100px) scale(0.9);
}

@keyframes toast-progress {
  from {
    width: 100%;
  }

  to {
    width: 0%;
  }
}
</style>
