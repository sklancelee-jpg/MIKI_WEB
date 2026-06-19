/**
 * tauriMock — mock layer for all @tauri-apps APIs.
 * Redirects FS calls to localStorage (VFS) and implements
 * mock events, native dialog picker, and menus.
 */

export enum BaseDirectory {
  Audio = 1,
  Cache = 2,
  Config = 3,
  Data = 4,
  LocalData = 5,
  Document = 6,
  Download = 7,
  Picture = 8,
  Public = 9,
  Video = 10,
  Resource = 11,
  Temp = 12,
  AppConfig = 13,
  AppData = 14,
  AppLocalData = 15,
  AppCache = 16,
  AppLog = 17,
  Desktop = 18,
  Executable = 19,
  Font = 20,
  Home = 21,
  Runtime = 22,
  Template = 23
}

// Memory cache for binary files (uploaded maps, custom fonts, etc.)
const binaryCache = new Map<string, Uint8Array>();

// Virtual file system key prefix
const STORAGE_PREFIX = 'miki:file:';

function getStorageKey(path: string): string {
  return STORAGE_PREFIX + path;
}

/* ── Menu Mocks ──────────────────────────────────────────── */

export class Menu {
  static async new() { return new Menu(); }
  async setAsAppMenu() { console.log('Mock menu set as app menu'); }
}

export class Submenu {
  static async new(_options?: any) { return new Submenu(); }
}

export class MenuItem {
  static async new(_options?: any) { return new MenuItem(); }
}

export class PredefinedMenuItem {
  static async new(_options?: any) { return new PredefinedMenuItem(); }
}

/* ── Event Mocks ─────────────────────────────────────────── */

export async function emit(event: string, payload?: any): Promise<void> {
  console.log('Mock event emit:', event, payload);
  const ev = new CustomEvent(`tauri:${event}`, { detail: payload });
  window.dispatchEvent(ev);
}

export async function listen(event: string, handler: (event: any) => void): Promise<() => void> {
  const wrapper = (e: Event) => {
    handler({ payload: (e as CustomEvent).detail });
  };
  window.addEventListener(`tauri:${event}`, wrapper);
  return () => {
    window.removeEventListener(`tauri:${event}`, wrapper);
  };
}

/* ── Dialog Mocks ────────────────────────────────────────── */

export async function open(options?: any): Promise<string | string[] | null> {
  console.log('Mock open picker:', options);
  if (options?.directory) {
    return '/virtual-fs';
  }

  // Create a temporary HTML input element to trigger file upload
  return new Promise<string | null>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (options?.filters) {
      const extensions = options.filters.flatMap((f: any) => f.extensions);
      input.accept = extensions.map((ext: string) => `.${ext}`).join(',');
    }
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        const virtualPath = `/virtual-fs/uploads/${Date.now()}-${file.name}`;
        binaryCache.set(virtualPath, bytes);
        resolve(virtualPath);
      };
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(file);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/* ── File System Mocks ───────────────────────────────────── */

export async function exists(path: string): Promise<boolean> {
  const key = getStorageKey(path);
  if (binaryCache.has(path)) return true;
  if (localStorage.getItem(key) !== null) return true;
  
  // Check if it's a folder (prefix match)
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(key + '/')) {
      return true;
    }
  }
  return false;
}

export async function mkdir(_path: string, _options?: any): Promise<void> {
  // Directories are virtual/implicit in key-value store
}

export async function readTextFile(path: string): Promise<string> {
  const key = getStorageKey(path);
  const content = localStorage.getItem(key);
  if (content === null) {
    throw new Error(`File not found: ${path}`);
  }
  return content;
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  const key = getStorageKey(path);
  localStorage.setItem(key, content);
}

export async function readFile(path: string): Promise<Uint8Array> {
  console.log('Mock readFile:', path);
  
  // 1. Template fallback
  if (path.includes('fantasy_map.png') || path.includes('timeline_template.png')) {
    const filename = path.includes('fantasy_map.png') ? 'fantasy_map.png' : 'timeline_template.png';
    const baseUrl = (import.meta as any).env?.BASE_URL || '/';
    const response = await fetch(`${baseUrl}templates/${filename}`);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  // 2. Memory cache check
  const cached = binaryCache.get(path);
  if (cached) {
    return cached;
  }

  // 3. LocalStorage decode
  const storedBase64 = localStorage.getItem(getStorageKey(path));
  if (storedBase64) {
    const binaryString = atob(storedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  throw new Error(`File not found: ${path}`);
}

export async function writeFile(path: string, data: Uint8Array): Promise<void> {
  console.log('Mock writeFile:', path, data.length);
  binaryCache.set(path, data);
  
  if (data.length < 1024 * 1024) { // Less than 1MB saved to local storage
    try {
      let binary = '';
      const len = data.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(data[i]);
      }
      const base64 = btoa(binary);
      localStorage.setItem(getStorageKey(path), base64);
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }
}

/* ── Seed Data Logic ─────────────────────────────────────── */

function seedVirtualFileSystem() {
  const seedKey = 'miki:seeded';
  if (localStorage.getItem(seedKey) === 'true') {
    return;
  }

  const welcomeWikiId = '223b76cb-7b41-4de0-8fc6-e55be353bde9';
  const wikis = [
    {
      id: welcomeWikiId,
      name: "Welcome Wiki",
      colorHex: "#a855f7",
      rootPath: "/virtual-fs/welcome-wiki",
      createdAt: new Date().toISOString(),
    }
  ];
  localStorage.setItem(STORAGE_PREFIX + 'miki-data/wikis.json', JSON.stringify(wikis, null, 2));

  const welcomePageId = '11111111-1111-1111-1111-111111111111';
  const editorGuideId = '22222222-2222-2222-2222-222222222222';
  const folderId = '33333333-3333-3333-3333-333333333333';
  const atlasId = '44444444-4444-4444-4444-444444444444';

  const entries = [
    {
      id: welcomePageId,
      kind: 'page',
      name: 'Welcome to MIKI',
      colorHex: '#a855f7',
      parentId: welcomeWikiId,
      osPath: `/virtual-fs/welcome-wiki/Welcome to MIKI.json`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: editorGuideId,
      kind: 'page',
      name: 'How to Use the Editor',
      colorHex: '#a855f7',
      parentId: welcomeWikiId,
      osPath: `/virtual-fs/welcome-wiki/How to Use the Editor.json`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: folderId,
      kind: 'folder',
      name: 'Worldbuilding',
      colorHex: '#3b82f6',
      parentId: welcomeWikiId,
      osPath: `/virtual-fs/welcome-wiki/Worldbuilding`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: atlasId,
      kind: 'atlas',
      name: 'Fantasy Map',
      colorHex: '#3b82f6',
      parentId: folderId,
      osPath: `/virtual-fs/welcome-wiki/Worldbuilding/Fantasy Map.json`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  localStorage.setItem(STORAGE_PREFIX + '/virtual-fs/welcome-wiki/entries.json', JSON.stringify(entries, null, 2));

  const welcomeContent = {
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Welcome to MIKI!' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'MIKI is a ' },
            { type: 'text', attrs: { bold: true }, text: 'local-first personal knowledge wiki' },
            { type: 'text', text: ' (a "Me-Wiki") designed for worldbuilders, writers, and notes organizers.' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Normally, MIKI runs as a desktop app and saves all your pages as plain JSON files in your local folders. In this ' },
            { type: 'text', attrs: { bold: true }, text: 'Web Demo' },
            { type: 'text', text: ', a virtual file system saves everything securely to your browser\'s ' },
            { type: 'text', attrs: { code: true }, text: 'localStorage' },
            { type: 'text', text: ' instead.' }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Quick Start' }]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'Create new folders and pages in the ' },
                    { type: 'text', attrs: { bold: true }, text: 'Worldbuilding' },
                    { type: 'text', text: ' folder.' }
                  ]
                }
              ]
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'Open the ' },
                    { type: 'text', attrs: { bold: true }, text: 'Fantasy Map' },
                    { type: 'text', text: ' atlas page to see interactive pins and text boxes over a map.' }
                  ]
                }
              ]
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'Add or modify attributes in the Right Panel of any page.' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    attributes: [
      { id: 'attr-1', label: 'Version', value: '1.0 (Web Demo)' },
      { id: 'attr-2', label: 'License', value: 'MIT' }
    ]
  };
  localStorage.setItem(STORAGE_PREFIX + `/virtual-fs/welcome-wiki/Welcome to MIKI.json`, JSON.stringify(welcomeContent, null, 2));

  const editorContent = {
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'How to Use the Editor' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'The Scriptorium is a full-featured rich-text editor based on TipTap. Here are some useful tips to get you writing:' }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Keyboard Shortcuts & Markdown Shortcuts' }]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', attrs: { bold: true }, text: '# ' },
                    { type: 'text', text: 'followed by Space creates a Heading 1.' }
                  ]
                }
              ]
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', attrs: { bold: true }, text: '## ' },
                    { type: 'text', text: 'followed by Space creates a Heading 2.' }
                  ]
                }
              ]
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', attrs: { bold: true }, text: '- ' },
                    { type: 'text', text: 'followed by Space creates a bullet list.' }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Right Panel: Attributes Table' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Use the right collapsible panel to manage metadata (attributes) for each page. Attributes are key-value pairs that help catalog your worldbuilding.' }
          ]
        }
      ]
    },
    attributes: [
      { id: 'attr-3', label: 'Difficulty', value: 'Easy' },
      { id: 'attr-4', label: 'Type', value: 'Guide' }
    ]
  };
  localStorage.setItem(STORAGE_PREFIX + `/virtual-fs/welcome-wiki/How to Use the Editor.json`, JSON.stringify(editorContent, null, 2));

  const atlasContent = {
    content: null,
    attributes: [],
    atlasData: {
      imagePath: 'templates/fantasy_map.png',
      pins: [
        {
          id: 'pin-1-id',
          label: 'Welcome to MIKI',
          x: 350,
          y: 250,
          targetId: welcomePageId,
          colorHex: '#a855f7'
        },
        {
          id: 'pin-2-id',
          label: 'Editor Guide',
          x: 600,
          y: 450,
          targetId: editorGuideId,
          colorHex: '#10b981'
        }
      ],
      textBoxes: [
        {
          id: 'textbox-1-id',
          text: 'The Whispering Peaks',
          x: 500,
          y: 150,
          width: 250,
          height: 45,
          fontFamily: 'Outfit',
          fontSize: 18,
          bold: true,
          italic: false,
          underline: false,
          colorHex: '#f59e0b'
        }
      ]
    }
  };
  localStorage.setItem(STORAGE_PREFIX + `/virtual-fs/welcome-wiki/Worldbuilding/Fantasy Map.json`, JSON.stringify(atlasContent, null, 2));

  localStorage.setItem(seedKey, 'true');
}

// Seed the virtual filesystem on import (if in browser)
if (typeof window !== 'undefined') {
  seedVirtualFileSystem();
}
