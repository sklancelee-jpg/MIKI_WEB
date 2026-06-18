# MIKI — Editor Domain Rules (Tiptap)

## Extensions to register
- StarterKit (base nodes + marks)
- Heading (levels 1, 2, 3 only)
- Image (with custom attributes: caption, alignment)
- TextStyle (required for color/font-family)
- Color
- FontFamily
- Underline

## Heading → ToC Rule
The ToC in the left panel is derived by parsing the Tiptap document AST directly.
Use a pure service function `parseHeadingTree(editorContent)` in `src/services/`.
Never query the DOM for headings — always read from the JSON node tree.

## Slash Commands
Trigger character: `/`
Available in MVP: /h1, /h2, /h3, /image
Implemented as a Tiptap extension (SuggestionExtension).

## Content Storage
Editor content is stored as Tiptap JSON (`{ type: 'doc', content: [...] }`).
This is nested inside the page's `.json` file under the `editor_content` key.
Never store as HTML. Never store as raw markdown.

## Image Nodes
Custom image extension must store: `src`, `alt`, `caption`, `alignment` (left/right/center).
Caption rendered as a 14px borderless input below the image.
