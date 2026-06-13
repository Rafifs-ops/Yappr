import { VueRenderer } from '@tiptap/vue-3'
import tippy from 'tippy.js'
import MentionList from '../components/MentionList.vue'

export default {
    // 1. Fungsi untuk mengambil data dari backend
    items: async ({ query }: { query: string }) => {
        if (!query) return []
        try {
            // Memanggil API yang kita buat di Langkah 1
            const response = await $fetch(`/api/user/search?q=${query}`)
            return response
        } catch (e) {
            return []
        }
    },

    // 2. Fungsi untuk memunculkan pop-up
    render: () => {
        let component: any
        let popup: any

        return {
            onStart: (props: any) => {
                // Render komponen MentionList.vue
                component = new VueRenderer(MentionList, {
                    props,
                    editor: props.editor,
                })

                if (!props.clientRect) {
                    return
                }

                // Setup posisi pop-up dengan Tippy.js
                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                })
            },

            onUpdate(props: any) {
                component.updateProps(props)

                if (!props.clientRect) {
                    return
                }

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                })
            },

            onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                    popup[0].hide()
                    return true
                }
                return component.ref?.onKeyDown(props)
            },

            onExit() {
                popup[0].destroy()
                component.destroy()
            },
        }
    },
}