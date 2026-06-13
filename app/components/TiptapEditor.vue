<template>
    <div
        class="tiptap-wrapper flex flex-col w-full bg-[#1a0b2e]/60 backdrop-blur-md rounded-xl border border-purple-800/50 focus-within:border-purple-500/70 focus-within:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all duration-300">
        <!-- Toolbar -->
        <div v-if="editor"
            class="toolbar flex flex-wrap items-center gap-1.5 p-2 bg-purple-900/30 border-b border-purple-800/50 rounded-t-xl">
            <!-- Text Formatting -->
            <button @click="editor.chain().focus().toggleBold().run()"
                :disabled="!editor.can().chain().focus().toggleBold().run()"
                :class="{ 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]': editor.isActive('bold'), 'text-purple-300 hover:bg-purple-800/50 hover:text-purple-100': !editor.isActive('bold') }"
                class="p-1.5 rounded-lg transition-all duration-200" title="Bold">
                <Icon name="material-symbols:format-bold" class="w-4 h-4" />
            </button>
            <button @click="editor.chain().focus().toggleItalic().run()"
                :disabled="!editor.can().chain().focus().toggleItalic().run()"
                :class="{ 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]': editor.isActive('italic'), 'text-purple-300 hover:bg-purple-800/50 hover:text-purple-100': !editor.isActive('italic') }"
                class="p-1.5 rounded-lg transition-all duration-200" title="Italic">
                <Icon name="material-symbols:format-italic" class="w-4 h-4" />
            </button>
            <button @click="editor.chain().focus().toggleStrike().run()"
                :disabled="!editor.can().chain().focus().toggleStrike().run()"
                :class="{ 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]': editor.isActive('strike'), 'text-purple-300 hover:bg-purple-800/50 hover:text-purple-100': !editor.isActive('strike') }"
                class="p-1.5 rounded-lg transition-all duration-200" title="Strikethrough">
                <Icon name="material-symbols:format-strikethrough" class="w-4 h-4" />
            </button>

            <div class="w-px h-5 bg-purple-800/50 mx-1"></div>

            <!-- Headings -->
            <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
                :class="{ 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]': editor.isActive('heading', { level: 1 }), 'text-purple-300 hover:bg-purple-800/50 hover:text-purple-100': !editor.isActive('heading', { level: 1 }) }"
                class="p-1.5 rounded-lg transition-all duration-200 font-bold font-mono text-[10px]" title="Heading 1">
                H1
            </button>
            <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
                :class="{ 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]': editor.isActive('heading', { level: 2 }), 'text-purple-300 hover:bg-purple-800/50 hover:text-purple-100': !editor.isActive('heading', { level: 2 }) }"
                class="p-1.5 rounded-lg transition-all duration-200 font-bold font-mono text-[10px]" title="Heading 2">
                H2
            </button>

            <div class="w-px h-5 bg-purple-800/50 mx-1"></div>

            <!-- Lists -->
            <button @click="editor.chain().focus().toggleBulletList().run()"
                :class="{ 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]': editor.isActive('bulletList'), 'text-purple-300 hover:bg-purple-800/50 hover:text-purple-100': !editor.isActive('bulletList') }"
                class="p-1.5 rounded-lg transition-all duration-200" title="Bullet List">
                <Icon name="material-symbols:format-list-bulleted" class="w-4 h-4" />
            </button>
            <button @click="editor.chain().focus().toggleOrderedList().run()"
                :class="{ 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]': editor.isActive('orderedList'), 'text-purple-300 hover:bg-purple-800/50 hover:text-purple-100': !editor.isActive('orderedList') }"
                class="p-1.5 rounded-lg transition-all duration-200" title="Ordered List">
                <Icon name="material-symbols:format-list-numbered" class="w-4 h-4" />
            </button>
            <button @click="editor.chain().focus().toggleCodeBlock().run()"
                :class="{ 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]': editor.isActive('codeBlock'), 'text-purple-300 hover:bg-purple-800/50 hover:text-purple-100': !editor.isActive('codeBlock') }"
                class="p-1.5 rounded-lg transition-all duration-200" title="Code Block">
                <Icon name="material-symbols:code-blocks-outline" class="w-4 h-4" />
            </button>
            <button @click="editor.chain().focus().toggleBlockquote().run()"
                :class="{ 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]': editor.isActive('blockquote'), 'text-purple-300 hover:bg-purple-800/50 hover:text-purple-100': !editor.isActive('blockquote') }"
                class="p-1.5 rounded-lg transition-all duration-200" title="Blockquote">
                <Icon name="material-symbols:format-quote" class="w-4 h-4" />
            </button>

            <div class="w-px h-5 bg-purple-800/50 mx-1"></div>

            <!-- Clear formatting -->
            <button @click="editor.chain().focus().clearNodes().unsetAllMarks().run()"
                class="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all duration-200"
                title="Clear Formatting">
                <Icon name="material-symbols:format-clear" class="w-4 h-4" />
            </button>

            <div class="flex-grow"></div>

            <!-- Undo/Redo -->
            <button @click="editor.chain().focus().undo().run()" :disabled="!editor.can().chain().focus().undo().run()"
                class="p-1.5 rounded-lg text-purple-300 hover:bg-purple-800/50 hover:text-purple-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                title="Undo">
                <Icon name="material-symbols:undo" class="w-4 h-4" />
            </button>
            <button @click="editor.chain().focus().redo().run()" :disabled="!editor.can().chain().focus().redo().run()"
                class="p-1.5 rounded-lg text-purple-300 hover:bg-purple-800/50 hover:text-purple-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                title="Redo">
                <Icon name="material-symbols:redo" class="w-4 h-4" />
            </button>
        </div>

        <!-- Editor Content -->
        <EditorContent :editor="editor"
            class="editor-content p-4 min-h-[120px] max-h-[350px] overflow-y-auto text-sm text-purple-100 custom-scrollbar" />
    </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import suggestion from '../composables/suggestion' // File terpisah untuk mengatur pop-up tippy.js

const content = defineModel({ type: String })

const editor = useEditor({
    content: content.value,
    extensions: [
        StarterKit,
        Mention.configure({
            HTMLAttributes: {
                class: 'text-purple-400 font-bold hover:underline cursor-pointer', // Styling tailwind untuk tag
            },
            suggestion, // Konfigurasi pop-up
            renderHTML({ options, node }) {
                return [
                    'a',
                    {
                        href: `/profile/${node.attrs.id}`, // Asumsi node.attrs.id menyimpan ID atau username
                        class: 'text-purple-400 font-bold hover:underline',
                    },
                    `@${node.attrs.label}`,
                ]
            },
        })
    ],
    editorProps: {
        attributes: {
            class: 'focus:outline-none w-full h-full min-h-[100px] prose prose-invert prose-sm max-w-none',
        },
    },
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
</script>

<style>
/* Global styles for tiptap editor content */
.editor-content .ProseMirror {
    outline: none !important;
}

.editor-content .ProseMirror p {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
    line-height: 1.5;
}

.editor-content .ProseMirror h1 {
    font-size: 1.5em;
    font-weight: 700;
    margin-top: 1em;
    margin-bottom: 0.5em;
    color: #fff;
    font-family: 'Orbitron', sans-serif;
}

.editor-content .ProseMirror h2 {
    font-size: 1.25em;
    font-weight: 700;
    margin-top: 1em;
    margin-bottom: 0.5em;
    color: #fff;
    font-family: 'Orbitron', sans-serif;
}

.editor-content .ProseMirror ul {
    list-style-type: disc;
    padding-left: 1.5em;
}

.editor-content .ProseMirror ol {
    list-style-type: decimal;
    padding-left: 1.5em;
}

.editor-content .ProseMirror blockquote {
    border-left: 3px solid rgba(168, 85, 247, 0.5);
    padding-left: 1em;
    color: #d8b4fe;
    font-style: italic;
    background: rgba(88, 28, 135, 0.1);
    padding: 0.5em 1em;
    border-radius: 0 0.5em 0.5em 0;
}

.editor-content .ProseMirror pre {
    background: #0f0518;
    color: #d8b4fe;
    padding: 0.75em 1em;
    border-radius: 0.5em;
    font-family: monospace;
    overflow-x: auto;
    border: 1px solid rgba(168, 85, 247, 0.3);
}

.editor-content .ProseMirror code {
    background: rgba(168, 85, 247, 0.2);
    color: #e9d5ff;
    padding: 0.1em 0.3em;
    border-radius: 0.2em;
    font-family: monospace;
    font-size: 0.9em;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(88, 28, 135, 0.1);
    border-radius: 8px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(168, 85, 247, 0.4);
    border-radius: 8px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(168, 85, 247, 0.6);
}
</style>