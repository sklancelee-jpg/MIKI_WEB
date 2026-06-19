import { z } from 'zod'

// ── Runtime schemas — match actual camelCase JSON on disk ────────────────────
// These validate data at every read boundary in persistence.ts.

const AttributeRuntimeSchema = z.object({
  id:    z.string().uuid(),
  label: z.string(),
  value: z.string(),
})

const PageStyleRuntimeSchema = z.object({
  borderColor:  z.string(),
  borderWidth:  z.number(),
  borderStyle:  z.enum(['solid', 'dashed', 'dotted', 'double', 'none']),
  borderRadius: z.number(),
})

const PinRuntimeSchema = z.object({
  id:       z.string().uuid(),
  label:    z.string(),
  x:        z.number(),
  y:        z.number(),
  targetId: z.string(),
  colorHex: z.string(),
})

const TextBoxRuntimeSchema = z.object({
  id:         z.string().uuid(),
  text:       z.string(),
  x:          z.number(),
  y:          z.number(),
  width:      z.number(),
  height:     z.number(),
  fontFamily: z.string(),
  fontSize:   z.number(),
  bold:       z.boolean(),
  italic:     z.boolean(),
  underline:  z.boolean(),
  colorHex:   z.string(),
})

const AtlasDataRuntimeSchema = z.object({
  imagePath: z.string(),
  pins:      z.array(PinRuntimeSchema).default([]),
  textBoxes: z.array(TextBoxRuntimeSchema).optional(),
})

export const WikiRuntimeSchema = z.object({
  id:         z.string().uuid(),
  name:       z.string().min(1),
  colorHex:   z.string(),
  rootPath:   z.string(),
  createdAt:  z.string(),
  coverImage: z.string().nullable().optional(),
  coverZoom:  z.number().optional(),
  coverPanX:  z.number().optional(),
  coverPanY:  z.number().optional(),
})

export const DirEntryRuntimeSchema = z.object({
  id:         z.string().uuid(),
  kind:       z.enum(['folder', 'page', 'atlas']),
  name:       z.string(),
  colorHex:   z.string(),
  parentId:   z.string(),
  osPath:     z.string(),
  createdAt:  z.string(),
  updatedAt:  z.string(),
  coverImage: z.string().nullable().optional(),
  coverZoom:  z.number().optional(),
  coverPanX:  z.number().optional(),
  coverPanY:  z.number().optional(),
})

export const PageFileRuntimeSchema = z.object({
  content:    z.any().nullable(),
  attributes: z.array(AttributeRuntimeSchema).default([]),
  coverImage: z.string().nullable().optional(),
  pageStyle:  PageStyleRuntimeSchema.optional(),
  atlasData:  AtlasDataRuntimeSchema.optional(),
})

// ── Spec schemas — planned document format (snake_case, for reference) ───────

// Canvas styling schema
export const MikiCanvasStylingSchema = z.object({
  background: z.object({
    mode: z.enum(['solid_color', 'texture_image']),
    color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#ffffff'),
    texture_path: z.string().nullable().default(null),
    opacity: z.number().min(0).max(100).default(100),
    blur_radius_px: z.number().min(0).max(20).default(0),
  }),
  border: z.object({
    type: z.enum(['none', 'standard_line', 'custom_upload']),
    style: z.enum(['solid', 'dashed', 'dotted', 'double']).default('solid'),
    thickness_px: z.number().min(0).max(24).default(1),
    color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#cbd5e1'),
    custom_asset_path: z.string().nullable().default(null),
  }),
})

// Page attribute row
export const MikiAttributeSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(100),
  value: z.string().max(500),
})

// Full page document schema
export const MikiDocumentSchema = z.object({
  wiki_id: z.string().uuid(),
  folder_id: z.string().uuid().nullable(),
  page_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  updated_at: z.string().datetime(),
  thumbnail_url: z.string().nullable(),
  styling: MikiCanvasStylingSchema,
  editor_content: z.object({
    type: z.literal('doc'),
    content: z.array(z.any()),
  }),
  attributes: z.array(MikiAttributeSchema),
})

// Folder config schema
export const FolderConfigSchema = z.object({
  folder_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  cover_image_path: z.string().nullable().default(null),
  created_at: z.string().datetime(),
})

// Wiki metadata schema
export const WikiMetadataSchema = z.object({
  wiki_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  created_at: z.string().datetime(),
  root_path: z.string(),
})

// Inferred TypeScript types
export type MikiDocument = z.infer<typeof MikiDocumentSchema>
export type MikiCanvasStyling = z.infer<typeof MikiCanvasStylingSchema>
export type MikiAttribute = z.infer<typeof MikiAttributeSchema>
export type FolderConfig = z.infer<typeof FolderConfigSchema>
export type WikiMetadata = z.infer<typeof WikiMetadataSchema>
