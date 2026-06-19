/**
 * WikiLinkCommandExtension — triggers a dropdown popup when "[[" is typed in the editor.
 * Queries searchService and useDirStore for wiki pages and folders.
 */

import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import { PluginKey } from '@tiptap/pm/state'
import WikiLinkMenu from './WikiLinkMenu'
import { useDirStore } from '../../../stores/useDirStore'
import { useWikiStore } from '../../../stores/useWikiStore'
import { search } from '../../../services/searchService'

export interface WikiLinkSuggestionProps {
  id: string
  name: string
  kind: 'page' | 'folder'
  path: string
}

export const WikiLinkCommandExtension = Extension.create({
  name: 'wikiLinkCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '[[',
        pluginKey: new PluginKey('wikiLinkSuggestion'),
        allowSpaces: true,

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
          const typedProps = props as WikiLinkSuggestionProps
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent([
              {
                type: 'text',
                text: typedProps.name,
                marks: [
                  {
                    type: 'internalLink',
                    attrs: {
                      targetId: typedProps.id,
                      targetKind: typedProps.kind,
                      targetName: typedProps.name,
                    },
                  },
                ],
              },
              {
                type: 'text',
                text: ' ',
              },
            ])
            .run()
        },

        items: ({ query }: { query: string }): WikiLinkSuggestionProps[] => {
          const entries = useDirStore.getState().entries
          const wikis = useWikiStore.getState().wikis

          if (!query.trim()) {
            return entries
              .filter((e) => e.kind === 'page' || e.kind === 'folder')
              .slice(0, 10)
              .map((e) => ({
                id: e.id,
                name: e.name,
                kind: e.kind as 'page' | 'folder',
                path: e.osPath,
              }))
          }

          const searchResults = search(query, wikis, entries, 10)
          return searchResults
            .filter((r) => r.kind === 'page' || r.kind === 'folder')
            .map((r) => ({
              id: r.id,
              name: r.name,
              kind: r.kind as 'page' | 'folder',
              path: r.path,
            }))
        },

        render: () => {
          let renderer: ReactRenderer<any> | null = null

          return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onStart: (props: any) => {
              renderer = new ReactRenderer(WikiLinkMenu, {
                props,
                editor: props.editor,
              })
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
