<script setup>
const props = defineProps({
    isYappinganActive: Boolean,
    isLikedActive: Boolean,
    isRepostedActive: Boolean
})

const emit = defineEmits(['toggleTabs']);

// Fungsi untuk menangani perubahan dari <select>
function handleSelectChange(event) {
    emit('toggleTabs', event.target.value);
}

// Fungsi untuk menangani klik dari <button>
function handleToggle(tab) {
    emit('toggleTabs', tab);
}
</script>

<template>
    <!-- Tampilan Mobile (Select) -->
    <div class="sm:hidden">
        <label for="tabs" class="sr-only">Select a tab</label>
        <!-- Gunakan @change di sini, bukan @click di option -->
        <select id="tabs" @change="handleSelectChange"
            class="block w-full px-3 py-2.5 bg-purple-900 border border-purple-300 text-purple-300 text-sm rounded-md focus:ring-purple-500 focus:border-purple-500 shadow-xs placeholder:text-body">
            <!-- Gunakan :selected untuk menentukan mana yang aktif -->
            <option value="yappingan" :selected="isYappinganActive">Yappingan</option>
            <option value="liked" :selected="isLikedActive">Liked</option>
            <option value="reposted" :selected="isRepostedActive">Reposted</option>
        </select>
    </div>

    <!-- Tampilan Desktop (Tabs) -->
    <ul class="hidden text-sm font-medium text-center sm:flex -space-x-px text-purple-300">
        <li class="w-full">
            <!-- Hapus bg-purple-900 & text-body dari class statis agar tidak bentrok -->
            <button type="button" :class="isYappinganActive ? 'bg-blue-600 text-white' : 'bg-purple-900 text-body'"
                @click="handleToggle('yappingan')"
                class="inline-block w-full border border-purple-300 rounded-s-md hover:text-white font-medium leading-5 text-sm px-4 py-2.5 transition-colors">
                Yappingan
            </button>
        </li>
        <li class="w-full">
            <button type="button" :class="isLikedActive ? 'bg-blue-600 text-white' : 'bg-purple-900 text-body'"
                @click="handleToggle('liked')"
                class="inline-block w-full border border-purple-300 hover:text-white font-medium leading-5 text-sm px-4 py-2.5 transition-colors">
                Liked
            </button>
        </li>
        <li class="w-full">
            <button type="button" :class="isRepostedActive ? 'bg-blue-600 text-white' : 'bg-purple-900 text-body'"
                @click="handleToggle('reposted')"
                class="inline-block w-full border border-purple-300 hover:text-white font-medium leading-5 text-sm px-4 py-2.5 rounded-e-md transition-colors">
                Reposted
            </button>
        </li>
    </ul>
</template>