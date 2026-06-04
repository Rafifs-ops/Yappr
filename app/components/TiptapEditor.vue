<template>
    <EditorContent :editor="editor" />
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const content = defineModel({ type: String })

const editor = useEditor({
    content: content.value,
    extensions: [StarterKit],
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

<style scoped></style>