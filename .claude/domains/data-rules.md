# MIKI — Data Domain Rules (File I/O)

## File Reading
All file reads go through Tauri's `plugin-fs` API.
Validate every file read result through the appropriate Zod schema before use.
Never pass raw file content into UI components.

## File Writing
Write page data as atomic JSON: read → modify (immutably) → write full object.
Never partial-update a JSON file in place.

## Directory Structure on Disk
```
WikiName/               ← user-named wiki folder
├── .wiki/              ← hidden config (name, color, nav history)
│   ├── wiki-metadata.json
│   └── navigation-state.json
├── page.json           ← loose page (not in any subfolder)
├── FolderName/         ← user-created subfolder
│   ├── .folder-config.json
│   └── page.json
└── assets/
    ├── page-thumbnails/
    ├── folder-covers/
    ├── custom-fonts/
    └── maps-atlases/
```

## Zod Schema Locations
All schemas defined in `src/models/schemas.ts`.
Import schemas from there — never redefine inline.

## XSS Rule
All user-entered text (page titles, attribute labels/values, captions) must pass through
the sanitization utility in `src/utils/sanitize.ts` before being written to disk.
