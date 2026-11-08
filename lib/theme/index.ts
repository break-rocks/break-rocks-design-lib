// The shared library of the themes (since design v4.0.0, specs v99.0.0 contracts/themes.md § Since v99.0.0): a
// theme document read as the apps draw it, the four families of theme surfaces, the hooks a universe theme sets,
// and the AA rule of the readability mask. TypeScript without a build, in the syntax Node strips as it is (no
// enum, no namespace), for the backend, the web and the tools; Flutter, iOS and Android take the same data from
// BrSurfaceFamily (dist/). It never refuses a document: the schema does (schemas/theme-v2.schema.json).
import { families, formerSurfaces, removedSurfaces, surfaceHook, type Family, type HookPart } from '../../dist/web/tokens.ts';

export { families, formerSurfaces, hueOfColor, monogramColor, removedSurfaces } from '../../dist/web/tokens.ts';

export type Variant = 'night' | 'day';
export type SurfaceColors = { background?: string; text?: string; secondaryText?: string };
export type Opacities = { night?: number; dim?: number; day?: number };
/** A theme read: per variant its palette and its four families; what was ignored, as paths. */
export type ReadTheme = {
  format: 'break-rocks-theme/1' | 'break-rocks-theme/2';
  variants: Record<Variant, { palette: Record<string, string>; families: Partial<Record<Family, SurfaceColors>>; readFrom: Partial<Record<Family, string>> }>;
  typography: { title?: string };
  imageSlots: { page?: unknown; pageHeader?: unknown };
  scrims: { page?: Opacities; pageHeader?: Opacities; mask?: Opacities };
  ignored: string[];
};

type Doc = Record<string, any>;
const COLORS = ['background', 'text', 'secondaryText'] as const;
const SLOTS = ['page', 'pageHeader'] as const;
const SCRIMS = ['page', 'pageHeader', 'mask'] as const;

/** The colors of a theme surface, its border and any other key dropped (listed in `ignored`). */
function colorsOf(value: Doc, at: string, ignored: string[]): SurfaceColors {
  const colors: SurfaceColors = {};
  for (const [key, v] of Object.entries(value ?? {})) {
    if ((COLORS as readonly string[]).includes(key)) colors[key as (typeof COLORS)[number]] = v as string;
    else ignored.push(`${at}.${key}`);
  }
  return colors;
}

/**
 * Reads a theme document (format 1 or 2) as the apps draw it since v4.0.0: per variant, each family given as is,
 * else the first former theme surface of its row given (contract § Since v99.0.0, formerSurfaces), its border
 * dropped; the other former theme surfaces of the row, the removed ones (removedSurfaces), surfaceRadius, shape,
 * typography.accent, and the image slots and scrims other than page, pageHeader (and mask) are ignored and listed
 * in `ignored`. A format 1 has no surfaces: its families follow its palette.
 */
export function readTheme(doc: Doc): ReadTheme {
  const ignored: string[] = [];
  const variants = {} as ReadTheme['variants'];
  for (const variant of ['night', 'day'] as const) {
    const v: Doc = doc.variants?.[variant] ?? {};
    const surfaces: Doc = v.surfaces ?? {};
    const read: ReadTheme['variants'][Variant] = { palette: { ...(v.palette ?? {}) }, families: {}, readFrom: {} };
    const used = new Set<string>();
    for (const family of families) {
      const key = family in surfaces ? family : formerSurfaces[family].find((k) => k in surfaces);
      if (!key) continue;
      used.add(key);
      read.families[family] = colorsOf(surfaces[key], `variants.${variant}.surfaces.${key}`, ignored);
      read.readFrom[family] = key;
    }
    for (const key of Object.keys(surfaces)) if (!used.has(key)) ignored.push(`variants.${variant}.surfaces.${key}${key in removedSurfaces ? ` (${removedSurfaces[key]})` : ''}`);
    variants[variant] = read;
  }
  for (const key of ['surfaceRadius', 'shape']) if (doc[key] !== undefined) ignored.push(key);
  if (doc.typography?.accent !== undefined) ignored.push('typography.accent');
  const imageSlots: ReadTheme['imageSlots'] = {};
  for (const [slot, value] of Object.entries(doc.imageSlots ?? {})) {
    if ((SLOTS as readonly string[]).includes(slot)) imageSlots[slot as (typeof SLOTS)[number]] = value;
    else ignored.push(`imageSlots.${slot}`);
  }
  if (doc.images?.texture !== undefined) ignored.push('images.texture');
  const scrims: ReadTheme['scrims'] = {};
  for (const [slot, value] of Object.entries(doc.scrims ?? {})) {
    if ((SCRIMS as readonly string[]).includes(slot)) scrims[slot as (typeof SCRIMS)[number]] = value as Opacities;
    else ignored.push(`scrims.${slot}`);
  }
  return { format: doc.format, variants, typography: doc.typography?.title !== undefined ? { title: doc.typography.title } : {}, imageSlots, scrims, ignored };
}

const SUFFIX: Record<HookPart, string> = { background: 'bg', text: 'text', secondaryText: 'muted' };
/** The CSS hooks of a variant of a theme read, to set on .universe-themed: { "--theme-surface-block-bg": "#1A0F2E", … }. */
export function themeHooks(read: ReadTheme, variant: Variant): Record<string, string> {
  const hooks: Record<string, string> = {};
  for (const [family, colors] of Object.entries(read.variants[variant].families) as [Family, SurfaceColors][]) {
    for (const part of Object.keys(SUFFIX) as HookPart[]) if (colors[part]) hooks[surfaceHook(family, part)] = colors[part]!;
  }
  return hooks;
}

// The AA rule of the readability mask (README § The readability mask): source-over in sRGB, each channel rounded.
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const lum = ([r, g, b]: number[]) => {
  const c = (v: number) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
};
const ratio = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

/**
 * The opacity of the readability mask for an image: the lowest multiple of `step` (from `floor` to 1) at which
 * every text keeps its minimum (4.5 for the body and the secondary text, 3 for the large text and the controls)
 * over every pixel of the image under the color of the page at that opacity, and at every opacity above it. The
 * backend runs it at publication for each display mode (the colors of the variant, the pixels of the image of
 * that variant, sampled) and serves it as scrims.mask; 1 when no opacity below holds.
 */
export function maskOpacity({ page, texts, pixels, floor = 0, step = 0.01 }: { page: string; texts: { color: string; min: number }[]; pixels: [number, number, number][]; floor?: number; step?: number }): number {
  const veil = rgb(page);
  const textRgb = texts.map((t) => ({ rgb: rgb(t.color), min: t.min }));
  const holds = (alpha: number) => pixels.every((p) => {
    const c = p.map((v, i) => Math.round(veil[i] * alpha + v * (1 - alpha)));
    return textRgb.every((t) => ratio(t.rgb, c) >= t.min);
  });
  const steps = Math.round(1 / step);
  let from = steps;
  for (let k = steps; k >= 0 && holds(k / steps); k--) from = k;
  return Math.max(floor, Math.round((from / steps) * 1e6) / 1e6);
}
