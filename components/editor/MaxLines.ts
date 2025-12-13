import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'

export const MaxLines = Extension.create({
    name: 'maxLines',

    addOptions() {
        return {
            maxLines: 3,
            onLimit: null,
        }
    },

    addProseMirrorPlugins() {
        const { maxLines, onLimit } = this.options
        const key = new PluginKey('maxLines')

        return [
            new Plugin({
                key,
                filterTransaction: (tr, state) => {
                    const { maxLines, onLimit } = this.options

                    let lineCount = 0
                    tr.doc.forEach((node) => {
                        if (node.type.name === 'paragraph') {
                            lineCount += node.textContent.split('\n').length
                        }
                    })

                    if (lineCount > maxLines) {
                        if (onLimit) onLimit()
                        return false
                    }

                    return true
                },
            }),
        ]
    },
})
