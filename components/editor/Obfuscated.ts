import { Mark, mergeAttributes, Command } from '@tiptap/core'

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        obfuscated: {
            toggleObfuscated: () => ReturnType
        }
    }
}

export const Obfuscated = Mark.create({
    name: 'obfuscated',

    addOptions() {
        return {
            HTMLAttributes: {},
        }
    },

    parseHTML() {
        return [
            {
                tag: 'span.obfuscated',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, { class: 'obfuscated' }),
            0,
        ]
    },

    addCommands() {
        return {
            toggleObfuscated:
                (): Command =>
                    ({ commands }) => {
                        return commands.toggleMark(this.name)
                    },
        }
    },
})
