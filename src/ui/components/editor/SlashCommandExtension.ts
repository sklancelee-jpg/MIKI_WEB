/**
 * SlashCommandExtension — triggers the slash menu when "/" is typed at the
 * start of a block. Requires @tiptap/suggestion (installed via package.json).
 */

import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import SlashMenu, { type SlashMenuHandle } from './SlashMenu'
import { getSlashItems, type SlashItem } from './slashItems'

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        startOfLine: true,
        allowSpaces: false,

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        command: ({ editor, range, props }: { editor: any; range: any; props: SlashItem }) => {
          props.command({ editor, range })
        },

        items: ({ query }: { query: string }) => getSlashItems(query),

        render: () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let renderer: ReactRenderer<SlashMenuHandle, any>

          return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onStart: (props: any) => {
              renderer = new ReactRenderer<SlashMenuHandle>(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                SlashMenu as any,
                { props, editor: props.editor }
              )
              document.body.appendChild(renderer.element)
            },

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onUpdate: (props: any) => {
              renderer?.updateProps(props)
            },

            onKeyDown: ({ event }: { event: KeyboardEvent }) => {
              if (event.key === 'Escape') {
                renderer?.element.remove()
                renderer?.destroy()
                return true
              }
              return renderer?.ref?.onKeyDown({ event }) ?? false
            },

            onExit: () => {
              renderer?.element.remove()
              renderer?.destroy()
            },
          }
        },
      }),
    ]
  },
})
