<template>
    <div class="quill-wrapper relative w-full group">
        <div v-if="isLoading"
            class="absolute inset-0 z-10 flex flex-col rounded-xl overflow-hidden border border-purple-800/30 bg-[#1a0b2e]/80 backdrop-blur-sm animate-pulse">
            <div class="h-[42px] border-b border-purple-800/30 bg-purple-900/10 flex items-center px-4 space-x-2">
                <div class="h-4 w-4 bg-purple-500/20 rounded"></div>
                <div class="h-4 w-4 bg-purple-500/20 rounded"></div>
                <div class="h-4 w-4 bg-purple-500/20 rounded"></div>
            </div>
            <div class="flex-1 p-4 space-y-3">
                <div class="h-3 w-3/4 bg-purple-500/10 rounded"></div>
                <div class="h-3 w-1/2 bg-purple-500/10 rounded"></div>
            </div>
        </div>

        <div ref="editorContainer" :class="{ 'opacity-0': isLoading, 'transition-opacity duration-300': true }"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

const content = defineModel({ type: String, default: '' })
const editorContainer = ref(null)
const isLoading = ref(true)
let quill = null

onMounted(() => {
    quill = new Quill(editorContainer.value, {
        theme: 'snow',
        placeholder: 'Mulai yapping di sini...',
        modules: {
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link'],
                ['clean']
            ]
        }
    })

    if (content.value) {
        quill.clipboard.dangerouslyPasteHTML(content.value)
    }

    // PERBAIKAN 1: Tambahkan parameter (delta, oldDelta, source)
    quill.on('text-change', (delta, oldDelta, source) => {
        // Hanya kirim update ke v-model JIKA perubahan dilakukan langsung oleh user (ketikan/klik)
        if (source === 'user') {
            const html = quill.root.innerHTML
            content.value = html === '<p><br></p>' ? '' : html
        }
    })

    setTimeout(() => {
        isLoading.value = false
    }, 150)
})

watch(content, (newValue) => {
    // PERBAIKAN 2: Jangan menimpa konten saat pengguna sedang fokus mengetik di dalam editor
    // Ini yang menyebabkan format hilang dan tombol toolbar tidak aktif!
    if (quill && newValue !== quill.root.innerHTML && !quill.hasFocus()) {
        quill.clipboard.dangerouslyPasteHTML(newValue || '')
    }
})

onBeforeUnmount(() => {
    quill = null
})
</script>

<style scoped>
/* --- PERBAIKAN TAILWIND PREFLIGHT --- */
/* Kembalikan ukuran Heading */
:deep(.ql-editor h1) {
    font-size: 2em !important;
    font-weight: bold !important;
    margin-bottom: 0.5em;
}

:deep(.ql-editor h2) {
    font-size: 1.5em !important;
    font-weight: bold !important;
    margin-bottom: 0.5em;
}

:deep(.ql-editor h3) {
    font-size: 1.17em !important;
    font-weight: bold !important;
    margin-bottom: 0.5em;
}

/* Kembalikan Bold, Italic, Underline, Strike */
:deep(.ql-editor strong),
:deep(.ql-editor b) {
    font-weight: bold !important;
    color: #fff !important;
}

:deep(.ql-editor em),
:deep(.ql-editor i) {
    font-style: italic !important;
}

:deep(.ql-editor u) {
    text-decoration: underline !important;
}

:deep(.ql-editor s) {
    text-decoration: line-through !important;
}

/* Kembalikan List (Bullet & Number) */
:deep(.ql-editor ol) {
    list-style-type: decimal !important;
    padding-left: 1.5em !important;
    margin-bottom: 0.5em;
}

:deep(.ql-editor ul) {
    list-style-type: disc !important;
    padding-left: 1.5em !important;
    margin-bottom: 0.5em;
}

:deep(.ql-editor li) {
    margin-bottom: 0.25em;
}

/* Kembalikan Link */
:deep(.ql-editor a) {
    color: #c084fc !important;
    text-decoration: underline !important;
}


/* --- PERBAIKAN WARNA TOMBOL TOOLBAR AKTIF (HEADING DLL) --- */
/* Agar menu dropdown Heading juga bisa menyala ungu saat aktif/di-hover */
:deep(.ql-snow .ql-toolbar .ql-picker-label.ql-active),
:deep(.ql-snow .ql-toolbar .ql-picker-label:hover) {
    color: #c084fc !important;
}

:deep(.ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke),
:deep(.ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke) {
    stroke: #c084fc !important;
}

:deep(.ql-snow .ql-toolbar .ql-picker-item.ql-selected),
:deep(.ql-snow .ql-toolbar .ql-picker-item:hover) {
    color: #c084fc !important;
}
</style>