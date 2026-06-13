<template>
    <div class="bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 w-48">
        <template v-if="items.length">
            <button v-for="(item, index) in items" :key="item._id"
                class="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 focus:bg-gray-800 transition-colors flex items-center gap-2"
                :class="{ 'bg-gray-800': index === selectedIndex }" @click="selectItem(index)">
                <!-- Avatar -->
                <div class="w-6 h-6 rounded-full bg-purple-500 overflow-hidden flex-shrink-0">
                    <img v-if="item.photo" :src="item.photo" class="w-full h-full object-cover" />
                </div>
                <!-- Info -->
                <div class="flex flex-col truncate">
                    <span class="font-bold text-white truncate">{{ item.name }}</span>
                    <span class="text-xs text-gray-400 truncate">@{{ item.username }}</span>
                </div>
            </button>
        </template>
        <div v-else class="px-4 py-2 text-sm text-gray-400">
            Tidak ada hasil
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
    items: { type: Array, required: true },
    command: { type: Function, required: true },
})

const selectedIndex = ref(0)

// Reset index jika hasil pencarian berubah
watch(() => props.items, () => {
    selectedIndex.value = 0
})

// Fungsi untuk navigasi menggunakan keyboard (Atas, Bawah, Enter)
const onKeyDown = ({ event }) => {
    if (event.key === 'ArrowUp') {
        selectedIndex.value = ((selectedIndex.value + props.items.length) - 1) % props.items.length
        return true
    }
    if (event.key === 'ArrowDown') {
        selectedIndex.value = (selectedIndex.value + 1) % props.items.length
        return true
    }
    if (event.key === 'Enter') {
        selectItem(selectedIndex.value)
        return true
    }
    return false
}

// Eksekusi ketika user diklik / di-enter
const selectItem = (index) => {
    const item = props.items[index]
    if (item) {
        // Masukkan data ke Tiptap
        props.command({ id: item._id, label: item.username })
    }
}

// Buka akses onKeyDown agar bisa dipanggil oleh tippy.js
defineExpose({ onKeyDown })
</script>