import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'

export const MaxLines = Extension.create({
    name: 'maxLines',

    addOptions() {
        return {
            maxLines: 3,
            // optional callback
            onLimit: null,
        }
    },

    addProseMirrorPlugins() {
        const key = new PluginKey('maxLines')
        const { maxLines, onLimit } = this.options

        return [
            new Plugin({
                key,
                view(editorView) {
                    let lastGoodDoc = editorView.state.doc

                    const update = () => {
                        const dom = editorView.dom as HTMLElement

                        const lineHeight = parseFloat(
                            window.getComputedStyle(dom).lineHeight || '0'
                        )

                        if (!lineHeight) return

                        const maxHeight = lineHeight * maxLines
                        const actualHeight = dom.scrollHeight

                        if (actualHeight > maxHeight) {
                            // revert
                            editorView.dispatch(
                                editorView.state.tr
                                    .replaceWith(
                                        0,
                                        editorView.state.doc.content.size,
                                        lastGoodDoc.content
                                    )
                            )
                            if (onLimit) onLimit()
                            return
                        }

                        lastGoodDoc = editorView.state.doc
                    }

                    return {
                        update,
                    }
                },
            }),
        ]
    },
})
