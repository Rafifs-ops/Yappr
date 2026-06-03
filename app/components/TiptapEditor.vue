<template>
    <div class="editor-wrapper flex flex-col w-full bg-[#1a0b2e]/80 border border-purple-800/50 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.15)] relative">
        <!-- Sci-Fi corner accents -->
        <div class="absolute top-0 left-0 w-8 h-[1px] bg-gradient-to-r from-purple-400 to-transparent"></div>
        <div class="absolute top-0 left-0 h-8 w-[1px] bg-gradient-to-b from-purple-400 to-transparent"></div>
        
        <div v-if="editor" class="toolbar flex flex-wrap items-center gap-1.5 p-3 bg-[#130722]/90 border-b border-purple-800/60 backdrop-blur-sm z-10">
            <button @click="editor.chain().focus().toggleBold().run()"
                :class="editor.isActive('bold') ? 'btn-active' : 'btn-inactive'"
                class="toolbar-btn" title="Bold">
                <Icon name="lucide:bold" class="w-4 h-4" />
            </button>

            <button @click="editor.chain().focus().toggleItalic().run()"
                :class="editor.isActive('italic') ? 'btn-active' : 'btn-inactive'"
                class="toolbar-btn" title="Italic">
                <Icon name="lucide:italic" class="w-4 h-4" />
            </button>
            
            <div class="w-px h-5 bg-purple-800/50 mx-1"></div>

            <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
                :class="editor.isActive('heading', { level: 1 }) ? 'btn-active' : 'btn-inactive'"
                class="toolbar-btn font-bold text-xs" title="Heading 1">
                H1
            </button>

            <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
                :class="editor.isActive('heading', { level: 2 }) ? 'btn-active' : 'btn-inactive'"
                class="toolbar-btn font-bold text-xs" title="Heading 2">
                H2
            </button>

            <button @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
                :class="editor.isActive('heading', { level: 3 }) ? 'btn-active' : 'btn-inactive'"
                class="toolbar-btn font-bold text-xs" title="Heading 3">
                H3
            </button>
            
            <div class="w-px h-5 bg-purple-800/50 mx-1"></div>

            <button @click="editor.chain().focus().toggleBulletList().run()"
                :class="editor.isActive('bulletList') ? 'btn-active' : 'btn-inactive'"
                class="toolbar-btn" title="Bullet List">
                <Icon name="lucide:list" class="w-4 h-4" />
            </button>
            
            <div class="w-px h-5 bg-purple-800/50 mx-1"></div>

            <button @click="editor.chain().focus().setTextAlign('left').run()"
                :class="editor.isActive({ textAlign: 'left' }) ? 'btn-active' : 'btn-inactive'"
                class="toolbar-btn" title="Align Left">
                <Icon name="lucide:align-left" class="w-4 h-4" />
            </button>
            <button @click="editor.chain().focus().setTextAlign('center').run()"
                :class="editor.isActive({ textAlign: 'center' }) ? 'btn-active' : 'btn-inactive'"
                class="toolbar-btn" title="Align Center">
                <Icon name="lucide:align-center" class="w-4 h-4" />
            </button>
            <button @click="editor.chain().focus().setTextAlign('right').run()"
                :class="editor.isActive({ textAlign: 'right' }) ? 'btn-active' : 'btn-inactive'"
                class="toolbar-btn" title="Align Right">
                <Icon name="lucide:align-right" class="w-4 h-4" />
            </button>
            
            <div class="w-px h-5 bg-purple-800/50 mx-1"></div>

            <button @click="setLink" :class="editor.isActive('link') ? 'btn-active' : 'btn-inactive'"
                class="toolbar-btn" title="Insert Link">
                <Icon name="lucide:link" class="w-4 h-4" />
            </button>

            <button v-if="editor.isActive('link')" @click="editor.chain().focus().unsetLink().run()"
                class="toolbar-btn text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/50" title="Remove Link">
                <Icon name="lucide:unlink" class="w-4 h-4" />
            </button>
            
            <div class="w-px h-5 bg-purple-800/50 mx-1"></div>

            <div class="flex items-center gap-2 px-2 py-1 rounded-md bg-purple-900/20 border border-purple-500/10">
                <Icon name="lucide:palette" class="w-4 h-4 text-purple-400" />
                <input type="color" @input="editor.chain().focus().setColor($event.target.value).run()"
                    :value="editor.getAttributes('textStyle').color || '#ffffff'" 
                    class="color-picker"
                    title="Ubah warna teks" />
            </div>
        </div>

        <EditorContent :editor="editor" class="editor-content flex-1 p-4 text-purple-50 min-h-[250px] cursor-text bg-transparent" />
    </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { TextAlign } from '@tiptap/extension-text-align'
import { Link } from '@tiptap/extension-link'
import { watch, onBeforeUnmount } from 'vue'

const content = defineModel({ type: String })

const editor = useEditor({
    content: content.value,
    editorProps: {
        attributes: {
            class: 'prose prose-sm sm:prose-base focus:outline-none max-w-full text-purple-50',
        },
    },
    extensions: [
        StarterKit,
        TextStyle,
        Color,
        TextAlign.configure({
            types: ['heading', 'paragraph'], // Terapkan rata tengah/kanan pada paragraf & heading
        }),
        Link.configure({
            openOnClick: false, // Set false agar link tidak langsung terbuka saat diklik di dalam editor
            autolink: true,     // Otomatis ubah teks seperti 'google.com' menjadi link
            HTMLAttributes: {
                class: 'text-purple-400 underline decoration-purple-500/50 hover:text-purple-300 transition-colors cursor-pointer',
            },
        }),
    ],
    onUpdate: ({ editor }) => {
        // Emit changes to the parent component via v-model
        content.value = editor.getHTML()
    },
    // Don't render on the server, only on the client after hydration
    immediatelyRender: false,
})

// Update editor content if model changes externally
watch(content, (newContent) => {
    const isSame = editor.value?.getHTML() === newContent
    if (!isSame && editor.value) {
        editor.value.commands.setContent(newContent, false)
    }
})

onBeforeUnmount(() => {
    if (editor.value) {
        editor.value.destroy()
    }
})

const setLink = () => {
    const previousUrl = editor.value.getAttributes('link').href
    const url = window.prompt('Masukkan URL:', previousUrl)

    // Jika user membatalkan (klik cancel)
    if (url === null) {
        return
    }

    // Jika user mengosongkan input, hapus link
    if (url === '') {
        editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
        return
    }

    // Set link baru
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}
</script>

<style scoped>
.toolbar-btn {
    @apply flex items-center justify-center min-w-[32px] h-[32px] px-2 rounded-lg border transition-all duration-200;
}

.btn-inactive {
    @apply bg-transparent border-transparent text-purple-300 hover:bg-purple-800/30 hover:text-purple-100 hover:border-purple-600/30;
}

.btn-active {
    @apply bg-purple-600/40 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)];
}

.color-picker {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-color: transparent;
    width: 24px;
    height: 24px;
    border: none;
    cursor: pointer;
    padding: 0;
    border-radius: 4px;
    overflow: hidden;
}

.color-picker::-webkit-color-swatch-wrapper {
    padding: 0;
}

.color-picker::-webkit-color-swatch {
    border: 1px solid rgba(168, 85, 247, 0.5);
    border-radius: 4px;
}

.color-picker::-moz-color-swatch {
    border: 1px solid rgba(168, 85, 247, 0.5);
    border-radius: 4px;
}

:deep(.ProseMirror) {
    outline: none !important;
    min-height: 100%;
}

:deep(.ProseMirror p) {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    color: rgba(167, 139, 250, 0.5); /* text-purple-400/50 */
    pointer-events: none;
    height: 0;
}

:deep(.ProseMirror ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
}

:deep(.ProseMirror h1) {
    font-size: 2em;
    font-weight: 700;
    margin-top: 0.67em;
    margin-bottom: 0.67em;
    color: #e9d5ff; /* purple-200 */
}

:deep(.ProseMirror h2) {
    font-size: 1.5em;
    font-weight: 700;
    margin-top: 0.83em;
    margin-bottom: 0.83em;
    color: #e9d5ff;
}

:deep(.ProseMirror h3) {
    font-size: 1.17em;
    font-weight: 700;
    margin-top: 1em;
    margin-bottom: 1em;
    color: #e9d5ff;
}
</style>