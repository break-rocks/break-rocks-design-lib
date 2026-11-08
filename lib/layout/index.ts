// The shared library of the layouts (specs contracts/layouts.md § The layout document, § Invariants,
// § Spans and rows, § The widget registry, § Layout derivation, § Reader retouches): one
// implementation, in TypeScript without dependency, of the check of a layout document (checkLayout),
// of the layout derivation of its tablet and phone canvases (deriveLayout), of the completion of a
// layout published before a widget joined the widget registry (applyRegistry) and of the reader
// retouches (applyRetouches). The backend runs it at publication and serves the derived document,
// which is the reference; the web theme studio runs the same code while a layout is composed;
// scripts/check-documents.mjs checks the documents of this repository with it. Flutter never derives.
//
// One file without import, written in the syntax that Node strips without a build (no enum, no
// namespace, no parameter property): the backend imports it from its submodule
// (design/lib/layout/index.ts), the web app likewise, Node runs it as it is (node >= 22.18).
// The widget registry is a parameter (registry/widgets.json, read by the caller).
//
// Since registryVersion 3 (specs v69.0.0 to v71.0.0, contracts/layouts.md § The dashboard): the
// widget rails "pinned" (read on a phone), the time column as a live button in a pinned rail of a
// phone canvas (invariant 3), the head row as a live button in a widget rail, the open votes on the
// page of a universe as a live button only (LAYOUT_WIDGET_NOT_ON_PAGE), the focus MAP, and the widgets
// that a layout published before is not completed with ("completion": false in the registry).
//
// Since specs v79.0.0 (D-217, contracts/layouts.md § The universe frame): the focus of a live button
// that switches are POSTS, CLIPS, MAP and DEBATES (withoutOldFocus serves one of before OPEN), a rail
// takes "contextual" (the contextual widget rail of the phone), the channels, the head row and "to
// handle" may be contextual (the head row then as a live button on the canvas, the contextual live
// buttons above the time column of a tablet and a desktop), the widget actions "step" and "turn" of
// the live line, and the phone canvas of the platform layout hud places no time column (invariant 3:
// the now page in the bottomBar).
//
// Since design v4.2.0 (specs v99.0.0, D-293, contracts/layouts.md § Since v99.0.0): the live line is
// merged into the time strip, which the apps draw at the head of the content column, never placed by a
// layout. The widget liveLine stays in the registry, marked "ignored", for the documents already
// published (expand then contract, D-203): a document that places it passes, its placement ignored
// (not checked, not counted in the widget budget, left out of the derived canvases); invariant 2
// (LAYOUT_LIVE_LINE_REQUIRED) is no longer raised; the action "turn" is withdrawn (a gesture "turn"
// keeps a valid shape, so that such a document stays readable, and is refused on any widget placed).
//
// Since design v2.9.0 (specs v49.9.0 to v50.1.0, contracts/layouts.md § The governance page, § The
// pages of a universe): the free blocks and the navigation widget in the registry, and the pages of a
// universe (checkPageCanvases, derivePage, checkPageLayout for the platform layouts with a "page").

export const LAYOUT_FORMAT = 'break-rocks-layout/1';
/** A layout document is at most 64 KB (LAYOUT_TOO_LARGE). */
export const LAYOUT_MAX_BYTES = 64 * 1024;
export const DESCRIPTION_MAX = 160;
/** At most 50 reader retouches per universe, layout and device (LAYOUT_RETOUCH_INVALID). */
export const RETOUCHES_MAX = 50;

export type UniverseKind = 'public' | 'private' | 'root';
export type CanvasName = 'desktop' | 'tablet' | 'phone';
export const CANVASES: readonly CanvasName[] = ['desktop', 'tablet', 'phone'];
export type Variant = 'full' | 'wide' | 'medium' | 'compact' | 'button' | 'hidden';
export type RailSide = 'START' | 'END' | 'BOTTOM';
export type LayoutRef = { universe: string; name: string; version?: number; deleted?: boolean };
export type Behavior = { kind: 'EXPAND' | 'OPEN' | 'SWITCH'; focus?: string; layout?: LayoutRef };

export type LayoutItem = {
  widget: string; variant: Variant;
  row?: number; col?: number; cols?: number; rows?: number;
  params?: Record<string, unknown>;
  gestures?: { doubleTap?: string; longPress?: string };
  rail?: string;
  behavior?: Behavior;
  contextual?: 'button' | 'hidden' | null;
  surface?: 'opaque' | 'transparent';
};
/**
 * A widget rail: folded is read on the desktop and the tablet, pinned (since v69.0.0) on the phone: its
 * live buttons along its edge, without a tab; contextual (since v79.0.0) on the phone with pinned only:
 * only its live buttons that carry a news badge are drawn, at most 3, and the rail without any is not drawn.
 */
export type LayoutRail = { id: string; side: RailSide; folded?: boolean; pinned?: boolean; contextual?: boolean };
export type LayoutCanvas = {
  columns: number; items: LayoutItem[]; rails?: LayoutRail[];
  /** Served: whether the canvas is derived from the desktop one. */
  derived?: boolean;
  /** The phone canvas only. */
  addressBar?: 'top' | 'bottom';
};
export type LayoutDocument = {
  format: string; universe?: string; name: string; description?: string; creator?: string;
  copiedFrom?: LayoutRef | null; collection?: string; derive?: boolean;
  canvases: { desktop: LayoutCanvas; tablet?: LayoutCanvas | null; phone?: LayoutCanvas | null };
  version?: number; registryVersion?: number;
  screenshots?: Partial<Record<CanvasName, string>> | null;
};

export type WidgetEntry = {
  /** The families of theme surfaces it is drawn on (since design v4.0.0: page, sky, block, control). */
  name: string; surfaces: string[]; variants: Variant[];
  /** A free block of a custom page and of the about page (since design v4.0.0, every widget being on the block). */
  freeBlock?: boolean;
  variantCanvases?: Partial<Record<Variant, CanvasName[]>>;
  params: Record<string, { values: unknown[]; default: unknown }>;
  offeredIn: UniverseKind[]; requiredIn: UniverseKind[];
  rail: boolean; contextual: string | null;
  /** The version of the widget registry it joined in (1 when absent). */
  since?: number;
  /** false: never added to a layout published before it joined (applyRegistry); the open votes, the members, "to handle". */
  completion?: boolean;
  /** The variants placed in a widget rail only (the head row as a live button, since v69.0.0). */
  railOnly?: Variant[];
  /** Never stowed, but a live button in a pinned rail of a phone canvas (the time column, since v69.0.0). */
  pinnedRail?: boolean;
  /** The behaviors its live button takes, when not all (the head row: OPEN). */
  behaviors?: Behavior['kind'][];
  /** "button": placed on the page of a universe as a live button only (the open votes, since v69.0.0). */
  onUniversePage?: 'button';
  /** Since specs v99.0.0: a widget no layout places any more (the live line); a placement is accepted and ignored. */
  ignored?: boolean;
};
export type WidgetRegistry = {
  registryVersion: number;
  breakpoints: Record<CanvasName, { columns: number; budget: number }>;
  spans: Record<string, Partial<Record<Variant, [number, number]>>>;
  variants: Variant[];
  actions: Record<string, { widgets?: string[] }>;
  widgets: Record<string, WidgetEntry>;
};

/** A refusal: its code (contracts/errors.md § Theme surfaces and layouts) and where ("canvases.phone.items[3]"). */
export type LayoutRefusal = { code: string; path: string; widget?: string };
/** [layout]: the universe and name of the document checked (set by checkLayout and applyRetouches), for the rules of one platform layout (hud). */
export type CheckContext = { kind: UniverseKind; registry: WidgetRegistry; layout?: { universe?: string; name: string } };

const VARIANTS: readonly Variant[] = ['full', 'wide', 'medium', 'compact', 'button', 'hidden'];
const SIDES: readonly RailSide[] = ['START', 'END', 'BOTTOM'];
/** The focus a live button switches to (MAP since v69.0.0; since v79.0.0, D-217, the four focus of a public universe). */
export const FOCUS: readonly string[] = ['POSTS', 'CLIPS', 'MAP', 'DEBATES'];
/** The values of UniverseFocus that are no longer focus since v79.0.0 (in the enum until no app reads them, D-203). */
export const OLD_FOCUS: readonly string[] = ['GOVERNANCE', 'SUB_UNIVERSES', 'SHOWCASE', 'AGENDA'];
/** The widget actions a gesture names: "turn" withdrawn since specs v99.0.0 (kept in the shape for the documents published before, refused on a widget placed). */
const ACTIONS = ['fullScreen', 'expand', 'open', 'switch', 'stow', 'variant', 'step', 'turn'];
/** The platform layout whose phone canvas places no time column (invariant 3 since v79.0.0: the now page in the bottomBar). */
const NOW_PAGE_LAYOUT = { universe: '%root', name: 'hud' };
const NAME = /^(?!.*\.\.)\p{L}[\p{L}\p{N}._-]{0,62}[\p{L}\p{N}_-]$/u;
const UNIVERSE = /^%\S+$/u;
const RAIL_ID = /^[a-z][a-z0-9-]{0,31}$/;
/** What the map widget shows, each parameter true by default (registry/widgets.json; contracts/layouts.md § The widget registry). */
const MAP_SHOWS = ['territory', 'events', 'subUniverses', 'locatableResidents'];
const ITEM_KEYS = new Set(['widget', 'variant', 'row', 'col', 'cols', 'rows', 'params', 'gestures', 'rail', 'behavior', 'contextual', 'surface']);
const DOC_KEYS = new Set(['format', 'universe', 'name', 'description', 'creator', 'copiedFrom', 'collection', 'derive', 'canvases', 'version', 'registryVersion', 'screenshots']);
const CANVAS_KEYS = new Set(['columns', 'items', 'rails', 'derived', 'addressBar']);

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const graphemes = (text: string) => {
  const Segmenter = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment(t: string): Iterable<unknown> } }).Segmenter;
  return Segmenter ? [...new Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].length : [...text].length;
};
const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length;

/**
 * The kind of universe a layout is checked for (contracts/layouts.md § Invariants): a layout of a
 * private universe (its first level ends with ".") and the platform layouts "feed-first-private" and
 * "studio-private" as for a private universe; one of %root or of a public universe as for a public
 * universe (so that it serves the public universes).
 */
export function kindOfLayout(universe: string | null | undefined, name: string | null | undefined): UniverseKind {
  const first = (universe ?? '').split('/')[0];
  return first.endsWith('.') || (first === '%root' && !!name && name.endsWith('-private')) ? 'private' : 'public';
}

/**
 * Whether a widget has the variants full (and hidden) only on the canvas: it covers any width of its
 * canvas and is never counted in the widget budget (a variant placed in a rail only, as the live
 * button of the head row, left aside).
 */
export const fullOnly = (widget: WidgetEntry) => widget.variants.every((v) => v === 'full' || v === 'hidden' || !!widget.railOnly?.includes(v));

/** The columns a variant of [widget] covers on a canvas of [columns] ([min, max]); a full-only widget: any width. */
export function spanOf(registry: WidgetRegistry, widget: WidgetEntry, variant: Variant, columns: number): [number, number] | undefined {
  if (variant === 'hidden') return undefined;
  if (fullOnly(widget)) return [1, columns];
  return registry.spans[String(columns)]?.[variant];
}

/** The reading order (contracts/layouts.md § Layout derivation, 1): by row, then by column; an item over several rows at its first row. */
export function readingOrder<T extends LayoutItem>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.row ?? 0) - (b.row ?? 0) || (a.col ?? 0) - (b.col ?? 0));
}

const placed = (item: LayoutItem) => item.rail === undefined && item.variant !== 'hidden';
/** Whether an item places a widget no layout places any more (the live line since specs v99.0.0): its placement ignored. */
export const isIgnored = (registry: WidgetRegistry, item: LayoutItem) => registry.widgets[item.widget]?.ignored === true;
/** The items of [items] whose placement counts (without the ignored ones). */
const kept = <T extends LayoutItem>(registry: WidgetRegistry, items: T[]) => items.filter((i) => !isIgnored(registry, i));

// ---- The shape of a document ----

/** The refusals of the shape of a document (what the JSON Schema of the format says, with the codes of the contract). */
export function checkShape(input: unknown): LayoutRefusal[] {
  const out: LayoutRefusal[] = [];
  const refuse = (code: string, path: string) => { out.push({ code, path }); };
  if (!isObject(input) || input.format !== LAYOUT_FORMAT) { refuse('LAYOUT_FORMAT_INVALID', 'format'); return out; }
  if (bytes(input) > LAYOUT_MAX_BYTES) { refuse('LAYOUT_TOO_LARGE', '(root)'); return out; }
  for (const key of Object.keys(input)) if (!DOC_KEYS.has(key)) refuse('LAYOUT_FORMAT_INVALID', key);
  if (typeof input.name !== 'string' || !NAME.test(input.name.normalize('NFC'))) refuse('LAYOUT_NAME_INVALID', 'name');
  if (input.universe !== undefined && (typeof input.universe !== 'string' || !UNIVERSE.test(input.universe))) refuse('LAYOUT_FORMAT_INVALID', 'universe');
  if (input.description !== undefined && (typeof input.description !== 'string' || graphemes(input.description.trim()) > DESCRIPTION_MAX)) refuse('LAYOUT_DESCRIPTION_TOO_LONG', 'description');
  if (input.derive !== undefined && typeof input.derive !== 'boolean') refuse('LAYOUT_FORMAT_INVALID', 'derive');
  if (input.copiedFrom != null && !(isObject(input.copiedFrom) && typeof input.copiedFrom.universe === 'string' && typeof input.copiedFrom.name === 'string')) refuse('LAYOUT_FORMAT_INVALID', 'copiedFrom');
  const canvases = input.canvases;
  if (!isObject(canvases)) { refuse('LAYOUT_DESKTOP_MISSING', 'canvases.desktop'); return out; }
  for (const key of Object.keys(canvases)) if (!(CANVASES as readonly string[]).includes(key)) refuse('LAYOUT_FORMAT_INVALID', `canvases.${key}`);
  if (!isObject(canvases.desktop)) refuse('LAYOUT_DESKTOP_MISSING', 'canvases.desktop');
  for (const name of CANVASES) {
    const canvas = canvases[name];
    if (canvas === null || canvas === undefined) {
      if (name !== 'desktop' && input.derive === false) refuse('LAYOUT_CANVAS_MISSING', `canvases.${name}`);
      continue;
    }
    const at = `canvases.${name}`;
    if (!isObject(canvas)) { refuse('LAYOUT_FORMAT_INVALID', at); continue; }
    for (const key of Object.keys(canvas)) {
      if (key === 'addressBar') { if (name !== 'phone' || !['top', 'bottom'].includes(canvas.addressBar as string)) refuse('LAYOUT_FRAME_INVALID', `${at}.addressBar`); }
      else if (!CANVAS_KEYS.has(key)) refuse('LAYOUT_FORMAT_INVALID', `${at}.${key}`);
    }
    if (![4, 8, 12].includes(canvas.columns as number)) refuse('LAYOUT_COLUMNS_INVALID', `${at}.columns`);
    if (!Array.isArray(canvas.items) || canvas.items.length > 64) { refuse('LAYOUT_FORMAT_INVALID', `${at}.items`); continue; }
    if (canvas.rails !== undefined) {
      if (!Array.isArray(canvas.rails) || canvas.rails.length > 3) refuse('LAYOUT_RAIL_INVALID', `${at}.rails`);
      else canvas.rails.forEach((rail, i) => {
        if (!isObject(rail) || typeof rail.id !== 'string' || !RAIL_ID.test(rail.id) || !(SIDES as readonly string[]).includes(rail.side as string)
          || (rail.folded !== undefined && typeof rail.folded !== 'boolean') || (rail.pinned !== undefined && typeof rail.pinned !== 'boolean')
          || (rail.contextual !== undefined && typeof rail.contextual !== 'boolean')
          || Object.keys(rail).some((k) => !['id', 'side', 'folded', 'pinned', 'contextual'].includes(k))) refuse('LAYOUT_RAIL_INVALID', `${at}.rails[${i}]`);
      });
    }
    (canvas.items as unknown[]).forEach((item, i) => {
      const path = `${at}.items[${i}]`;
      if (!isObject(item)) { refuse('LAYOUT_FORMAT_INVALID', path); return; }
      for (const key of Object.keys(item)) if (!ITEM_KEYS.has(key)) refuse('LAYOUT_FORMAT_INVALID', `${path}.${key}`);
      if (typeof item.widget !== 'string') refuse('LAYOUT_WIDGET_UNKNOWN', `${path}.widget`);
      if (!(VARIANTS as readonly string[]).includes(item.variant as string)) refuse('LAYOUT_VARIANT_NOT_ALLOWED', `${path}.variant`);
      for (const key of ['row', 'col', 'cols', 'rows'] as const) {
        if (item[key] !== undefined && (!isInt(item[key]) || (item[key] as number) < 1 || (item[key] as number) > (key === 'col' || key === 'cols' ? 12 : 64))) refuse('LAYOUT_SPAN_INVALID', `${path}.${key}`);
      }
      if (item.rail !== undefined && (typeof item.rail !== 'string' || !RAIL_ID.test(item.rail))) refuse('LAYOUT_RAIL_INVALID', `${path}.rail`);
      if (item.params !== undefined && !isObject(item.params)) refuse('LAYOUT_PARAM_INVALID', `${path}.params`);
      if (item.gestures !== undefined) {
        if (!isObject(item.gestures)) refuse('LAYOUT_GESTURE_INVALID', `${path}.gestures`);
        else for (const [gesture, action] of Object.entries(item.gestures)) {
          if (!['doubleTap', 'longPress'].includes(gesture) || !ACTIONS.includes(action as string)) refuse('LAYOUT_GESTURE_INVALID', `${path}.gestures.${gesture}`);
        }
      }
      if (item.behavior !== undefined) {
        const b = item.behavior;
        const ok = isObject(b) && (
          ((b.kind === 'EXPAND' || b.kind === 'OPEN') && Object.keys(b).length === 1)
          || (b.kind === 'SWITCH' && Object.keys(b).length === 2 && (FOCUS.includes(b.focus as string)
            || (isObject(b.layout) && typeof b.layout.universe === 'string' && UNIVERSE.test(b.layout.universe) && typeof b.layout.name === 'string' && NAME.test(b.layout.name)))));
        if (!ok) refuse('LAYOUT_BEHAVIOR_INVALID', `${path}.behavior`);
      }
      if (item.contextual !== undefined && item.contextual !== null && !['button', 'hidden'].includes(item.contextual as string)) refuse('LAYOUT_CONTEXTUAL_INVALID', `${path}.contextual`);
      if (item.surface !== undefined && !['opaque', 'transparent'].includes(item.surface as string)) refuse('LAYOUT_FORMAT_INVALID', `${path}.surface`);
    });
  }
  if (input.screenshots !== undefined && input.screenshots !== null && !isObject(input.screenshots)) refuse('LAYOUT_SCREENSHOTS_GENERATED', 'screenshots');
  return out;
}

// ---- A canvas against the registry and the invariants ----

/** Whether an item may take [action] as the target of a gesture. */
function actionAllowed(registry: WidgetRegistry, action: string, item: LayoutItem, widget: WidgetEntry, kind: UniverseKind) {
  switch (action) {
    case 'fullScreen': return (registry.actions.fullScreen?.widgets ?? ['feed']).includes(item.widget);
    case 'expand': return item.variant === 'button' && item.rail === undefined;
    case 'switch': return item.variant === 'button';
    case 'stow': case 'variant': return !widget.requiredIn.includes(kind);
    // Since specs v99.0.0, step is the action of the time strip, which the apps draw (no widget), and turn is withdrawn.
    case 'step': case 'turn': return (registry.actions[action]?.widgets ?? []).includes(item.widget);
    default: return action === 'open';
  }
}

/**
 * The refusals of one canvas ([name]) of a document whose shape is valid, for a kind of universe:
 * the widgets, variants, spans, overlaps, rails, behaviors, contextual widgets, gestures and
 * parameters against the registry, then the invariants and the widget budget. A required widget
 * hidden or stowed in a rail is refused by its invariant only ("the feed is always on the page"),
 * but for the time column as a live button in a pinned rail of a phone canvas (invariant 3, since
 * v69.0.0), which is shown.
 */
export function checkCanvas(canvas: LayoutCanvas, name: CanvasName, context: CheckContext, at = `canvases.${name}`): LayoutRefusal[] {
  const { registry, kind } = context;
  const out: LayoutRefusal[] = [];
  const refuse = (code: string, path: string, widget?: string) => { out.push({ code, path, ...(widget ? { widget } : {}) }); };
  const { columns } = canvas;
  const rails = canvas.rails ?? [];
  const ids = new Set<string>();
  const sides = new Set<string>();
  rails.forEach((rail, i) => {
    if (ids.has(rail.id) || sides.has(rail.side)) refuse('LAYOUT_RAIL_INVALID', `${at}.rails[${i}]`);
    ids.add(rail.id); sides.add(rail.side);
  });
  const cells = new Set<string>();
  const shown: { item: LayoutItem; counted: boolean }[] = [];
  canvas.items.forEach((item, i) => {
    const path = `${at}.items[${i}]`;
    const widget = registry.widgets[item.widget];
    if (!widget) return refuse('LAYOUT_WIDGET_UNKNOWN', `${path}.widget`, item.widget);
    // A widget no layout places any more (the live line since v99.0.0): its placement ignored, nothing checked nor counted.
    if (widget.ignored) return;
    const required = widget.requiredIn.includes(kind);
    // A live button in a pinned rail of a phone canvas, for a widget that may not be stowed otherwise (the time column).
    const pinned = !!widget.pinnedRail && name === 'phone' && item.variant === 'button' && item.rail !== undefined && rails.some((r) => r.id === item.rail && r.pinned === true);
    // A required widget not shown: its invariant says why.
    if (required && !placed(item) && !pinned) return;
    const limited = widget.variantCanvases?.[item.variant];
    if (!widget.variants.includes(item.variant) || (limited && !limited.includes(name))) refuse('LAYOUT_VARIANT_NOT_ALLOWED', `${path}.variant`, item.widget);
    // A variant in a rail only, on the canvas as a contextual live button (the head row above the time column, since v79.0.0).
    else if (widget.railOnly?.includes(item.variant) && item.rail === undefined && !(item.contextual && widget.contextual)) refuse('LAYOUT_RAIL_INVALID', `${path}.rail`, item.widget);
    for (const [key, value] of Object.entries(item.params ?? {})) {
      if (!widget.params[key]?.values.includes(value)) refuse('LAYOUT_PARAM_INVALID', `${path}.params.${key}`, item.widget);
    }
    // The map widget shows at least one thing (specs v49.8.0): its four parameters all false is refused.
    if (item.widget === 'map' && MAP_SHOWS.every((p) => item.params?.[p] === false)) refuse('LAYOUT_PARAM_INVALID', `${path}.params`, item.widget);
    if (item.behavior && (item.variant !== 'button' || (widget.behaviors && !widget.behaviors.includes(item.behavior.kind)))) refuse('LAYOUT_BEHAVIOR_INVALID', `${path}.behavior`, item.widget);
    if (item.rail !== undefined) {
      if (!ids.has(item.rail) || !(widget.rail || pinned) || item.variant !== 'button') refuse('LAYOUT_RAIL_INVALID', `${path}.rail`, item.widget);
      if (item.behavior?.kind === 'EXPAND') refuse('LAYOUT_BEHAVIOR_INVALID', `${path}.behavior`, item.widget);
      if (item.row !== undefined || item.col !== undefined || item.cols !== undefined || item.rows !== undefined) refuse('LAYOUT_RAIL_INVALID', path, item.widget);
    } else if (item.variant !== 'hidden') {
      const span = spanOf(registry, widget, item.variant, columns) ?? [1, columns];
      if (item.row === undefined || item.col === undefined || item.cols === undefined) refuse('LAYOUT_SPAN_INVALID', path, item.widget);
      else {
        if (item.cols < span[0] || item.cols > span[1] || item.col + item.cols - 1 > columns) refuse('LAYOUT_SPAN_INVALID', path, item.widget);
        let overlaps = false;
        for (let r = item.row; r < item.row + (item.rows ?? 1); r++) {
          for (let c = item.col; c < item.col + item.cols; c++) {
            if (cells.has(`${r},${c}`)) overlaps = true;
            cells.add(`${r},${c}`);
          }
        }
        if (overlaps) refuse('LAYOUT_ITEMS_OVERLAP', path, item.widget);
      }
    }
    if (item.contextual !== undefined && item.contextual !== null && !widget.contextual) refuse('LAYOUT_CONTEXTUAL_INVALID', `${path}.contextual`, item.widget);
    for (const [gesture, action] of Object.entries(item.gestures ?? {})) {
      if ((gesture === 'longPress' && item.widget === 'feed') || !actionAllowed(registry, action as string, item, widget, kind)) refuse('LAYOUT_GESTURE_INVALID', `${path}.gestures.${gesture}`, item.widget);
    }
    if (widget.offeredIn.includes(kind) && (placed(item) || pinned)) shown.push({ item, counted: placed(item) && !fullOnly(widget) });
  });
  const on = (widget: string) => shown.filter((s) => s.item.widget === widget).map((s) => s.item);
  if (!on('identityBar').length) refuse('LAYOUT_IDENTITY_REQUIRED', at, 'identityBar');
  // Invariant 2 (the live line) withdrawn since v99.0.0: the time strip is drawn by the apps.
  const nowPage = name === 'phone' && context.layout?.universe === NOW_PAGE_LAYOUT.universe && context.layout?.name === NOW_PAGE_LAYOUT.name;
  if (registry.widgets.timeColumn?.requiredIn.includes(kind) && !on('timeColumn').length && !nowPage) refuse('LAYOUT_TIME_COLUMN_REQUIRED', at, 'timeColumn');
  const feed = on('feed');
  if (!feed.length) refuse('LAYOUT_FEED_REQUIRED', at, 'feed');
  if (name !== 'phone' && feed.some((i) => (i.cols ?? 0) * 2 < columns)) refuse('LAYOUT_FEED_TOO_NARROW', at, 'feed');
  if (registry.widgets.rulesPost?.requiredIn.includes(kind)) {
    const rules = on('rulesPost');
    const first = (items: LayoutItem[]) => readingOrder(items)[0];
    if (!rules.length || (feed.length && readingOrder([first(rules), first(feed)])[0] !== first(rules))) refuse('LAYOUT_RULES_POST_REQUIRED', at, 'rulesPost');
  }
  if (shown.filter((s) => s.counted).length > (registry.breakpoints[name]?.budget ?? Infinity)) refuse('LAYOUT_BUDGET_EXCEEDED', at);
  return out;
}

/**
 * The refusals of what the page of a universe does not place (a layout of the format 1 without
 * "page"): a widget whose "onUniversePage" is "button" (the open votes, since v69.0.0) in another
 * variant than button or hidden, LAYOUT_WIDGET_NOT_ON_PAGE. Not part of checkCanvas, which a page
 * that places them (the governance page of the backend) runs too.
 */
export function checkUniversePage(canvas: LayoutCanvas, registry: WidgetRegistry, at: string): LayoutRefusal[] {
  const out: LayoutRefusal[] = [];
  canvas.items.forEach((item, i) => {
    if (registry.widgets[item.widget]?.onUniversePage === 'button' && item.variant !== 'button' && item.variant !== 'hidden') out.push({ code: 'LAYOUT_WIDGET_NOT_ON_PAGE', path: `${at}.items[${i}].widget`, widget: item.widget });
  });
  return out;
}

// ---- The derivation ----

/** The variant of [widget] whose span at [columns] holds [cols] (contracts/layouts.md § Layout derivation, 2), and the columns it then covers. */
function fitted(registry: WidgetRegistry, widget: WidgetEntry, variant: Variant, cols: number, columns: number): { variant: Variant; cols: number } {
  if (variant === 'full') return { variant, cols: fullOnly(widget) ? Math.min(cols, columns) : columns };
  if (variant === 'button') return { variant, cols: Math.max(1, Math.min(cols, (registry.spans[String(columns)]?.button ?? [1, 1])[1])) };
  if (fullOnly(widget)) return { variant: 'full', cols: Math.min(Math.max(1, cols), columns) };
  const candidates = widget.variants.filter((v) => v !== 'hidden' && v !== 'button');
  const holding = candidates.find((v) => { const s = spanOf(registry, widget, v, columns); return !!s && cols >= s[0] && cols <= s[1]; });
  if (holding) return { variant: holding, cols };
  // None holds it: the variant whose span is the closest, at the nearest width it allows.
  let best: { variant: Variant; cols: number; gap: number } | undefined;
  for (const v of candidates) {
    const s = spanOf(registry, widget, v, columns);
    if (!s) continue;
    const near = Math.min(Math.max(cols, s[0]), s[1]);
    const gap = Math.abs(near - cols);
    if (!best || gap < best.gap) best = { variant: v, cols: near, gap };
  }
  return best ? { variant: best.variant, cols: best.cols } : { variant, cols };
}

const END_RAIL = 'end';
/** The END rail of a canvas, added folded when it has none (its id "end", or "end-<n>" when taken). */
function endRail(canvas: LayoutCanvas): string {
  canvas.rails ??= [];
  const found = canvas.rails.find((r) => r.side === 'END');
  if (found) return found.id;
  let id = END_RAIL;
  for (let n = 2; canvas.rails.some((r) => r.id === id); n++) id = `${END_RAIL}-${n}`;
  canvas.rails.push({ id, side: 'END', folded: true });
  return id;
}

/** A widget as a live button that opens, in the rail [rail]: its parameters and contextual setting kept. */
function stowed(item: LayoutItem, rail: string): LayoutItem {
  const { row: _r, col: _c, cols: _n, rows: _m, gestures: _g, surface: _s, behavior: _b, ...rest } = item;
  void _r; void _c; void _n; void _m; void _g; void _s; void _b;
  return { ...rest, variant: 'button', rail, behavior: { kind: 'OPEN' } };
}

/** The tablet canvas derived from the desktop one (contracts/layouts.md § Layout derivation, 2). */
export function deriveTablet(desktop: LayoutCanvas, registry: WidgetRegistry, kind: UniverseKind): LayoutCanvas {
  const columns = registry.breakpoints.tablet?.columns ?? 8;
  const from = desktop.columns;
  const canvas: LayoutCanvas = { columns, items: [], rails: clone(desktop.rails ?? []), derived: true };
  const items = kept(registry, desktop.items);
  const others = items.filter((i) => !placed(i)).map((i) => clone(i));
  const rows = [...new Set(items.filter(placed).map((i) => i.row ?? 1))].sort((a, b) => a - b);
  const out: LayoutItem[] = [];
  const free = (row: number, col: number, cols: number, span: number) => col >= 1 && col + cols - 1 <= columns && !out.some((o) =>
    row < (o.row ?? 1) + (o.rows ?? 1) && (o.row ?? 1) < row + span && col < (o.col ?? 1) + (o.cols ?? 1) && (o.col ?? 1) < col + cols);
  let offset = 0;
  for (const row of rows) {
    let pending = readingOrder(items.filter((i) => placed(i) && (i.row ?? 1) === row)).map((item) => {
      const widget = registry.widgets[item.widget];
      let cols = Math.max(1, Math.round(((item.cols ?? 1) * columns) / from));
      if (item.widget === 'feed') cols = Math.max(cols, Math.ceil(columns / 2));
      const fit = widget ? fitted(registry, widget, item.variant, cols, columns) : { variant: item.variant, cols: Math.min(cols, columns) };
      return { item, ...fit, col: Math.round((((item.col ?? 1) - 1) * columns) / from) + 1 };
    });
    let at = row + offset;
    for (let pass = 0; pending.length && pass < 64; pass++) {
      const left: typeof pending = [];
      let cursor = 1;
      for (const p of pending) {
        if (left.length) { left.push(p); continue; }
        const span = p.item.rows ?? 1;
        let col = pass === 0 ? Math.max(p.col, cursor) : cursor;
        if (!free(at, col, p.cols, span)) {
          // The first place of the row that holds it, after the items before it.
          col = 0;
          for (let c = cursor; c + p.cols - 1 <= columns; c++) if (free(at, c, p.cols, span)) { col = c; break; }
        }
        if (!col) { left.push(p); continue; }
        out.push({ ...clone(p.item), variant: p.variant, row: at, col, cols: p.cols });
        cursor = col + p.cols;
      }
      pending = left;
      if (pending.length) {
        // The items that no longer fit move to a new row under it: the rows after move down, an item over several rows grows over it.
        for (const o of out) if ((o.row ?? 1) + (o.rows ?? 1) - 1 > at) o.rows = (o.rows ?? 1) + 1;
        offset += 1; at += 1;
      }
    }
  }
  // Beyond the budget, the last widgets counted in the reading order (never a required one) become live buttons in the END rail.
  const budget = registry.breakpoints.tablet?.budget ?? 6;
  const counted = (i: LayoutItem) => { const w = registry.widgets[i.widget]; return !!w && w.offeredIn.includes(kind) && !fullOnly(w); };
  let over = readingOrder(out).filter(counted).length - budget;
  const order = readingOrder(out).reverse();
  for (const item of order) {
    if (over <= 0) break;
    const w = registry.widgets[item.widget];
    if (!counted(item) || !w || w.requiredIn.includes(kind) || !w.rail) continue;
    const rail = endRail(canvas);
    out.splice(out.indexOf(item), 1, stowed(item, rail));
    over -= 1;
  }
  canvas.items = [...readingOrder(out.filter(placed)), ...out.filter((i) => !placed(i)), ...others];
  return canvas;
}

/** The phone canvas derived from the desktop one (contracts/layouts.md § Layout derivation, 3). */
export function derivePhone(desktop: LayoutCanvas, registry: WidgetRegistry): LayoutCanvas {
  const columns = registry.breakpoints.phone?.columns ?? 4;
  const canvas: LayoutCanvas = { columns, items: [], rails: [], derived: true, addressBar: 'top' };
  const items = kept(registry, desktop.items);
  const shownOnCanvas = readingOrder(items.filter(placed));
  // A contextual live button on the canvas in a variant of a rail only (the head row, since v79.0.0) joins the END rail.
  const has = (widget: string) => shownOnCanvas.find((i) => i.widget === widget && !registry.widgets[widget]?.railOnly?.includes(i.variant));
  // The time strip comes under the identity bar, drawn by the apps (the live line until v99.0.0).
  const head = ['universeBanner', 'identityBar', 'timeColumn', 'rulesPost', 'headRow', 'feed'];
  let row = 0;
  for (const widget of head) {
    const item = has(widget);
    if (!item) continue;
    row += 1;
    const { rows: _rows, rail: _rail, ...rest } = clone(item);
    void _rows; void _rail;
    if (widget === 'timeColumn') canvas.items.push({ ...rest, variant: 'button', row, col: 1, cols: 1 });
    else canvas.items.push({ ...rest, variant: 'full', row, col: 1, cols: columns });
  }
  // Every other widget shown or in a rail on the desktop: a live button that opens, in one END rail, in the reading order.
  const railOrder = (side: RailSide) => items.filter((i) => i.rail !== undefined && (desktop.rails ?? []).find((r) => r.id === i.rail)?.side === side);
  const onPhone = new Set(canvas.items.map((i) => i.widget));
  const rest = [...railOrder('START'), ...shownOnCanvas, ...railOrder('END'), ...railOrder('BOTTOM'), ...items.filter((i) => i.rail !== undefined && !(desktop.rails ?? []).some((r) => r.id === i.rail))]
    .filter((i) => !onPhone.has(i.widget));
  for (const item of rest) {
    const widget = registry.widgets[item.widget];
    if (widget?.rail) canvas.items.push(stowed(item, endRail(canvas)));
    else {
      // A widget that cannot be a live button (its variants full and hidden only): hidden on the phone.
      canvas.items.push({ widget: item.widget, variant: 'hidden', ...(item.params ? { params: clone(item.params) } : {}) });
    }
  }
  // The widgets hidden on the desktop stay hidden.
  for (const item of items.filter((i) => i.rail === undefined && i.variant === 'hidden')) canvas.items.push(clone(item));
  return canvas;
}

/**
 * The document as served (contracts/layouts.md § The layout document: "its three canvases, each
 * with derived", "registryVersion"): the canvases left null derived from the desktop one when the
 * layout derives them (derive true by default), the canvases given kept as they are (a canvas given
 * replaces the derived one entirely). Expects a document whose shape is valid.
 */
export function deriveLayout(document: LayoutDocument, registry: WidgetRegistry): LayoutDocument {
  const doc = clone(document);
  const kind = kindOfLayout(doc.universe, doc.name);
  const desktop: LayoutCanvas = { ...doc.canvases.desktop, derived: false };
  const own = (c: LayoutCanvas | null | undefined) => (c ? { ...c, derived: false } : null);
  const derive = doc.derive !== false;
  const tablet = own(doc.canvases.tablet) ?? (derive ? deriveTablet(desktop, registry, kind) : null);
  const phone = own(doc.canvases.phone) ?? (derive ? derivePhone(desktop, registry) : null);
  return { ...doc, derive, canvases: { desktop, tablet, phone }, registryVersion: registry.registryVersion };
}

/** The document as published from the one served: the derived canvases null again. */
export function publishedOf(served: LayoutDocument): LayoutDocument {
  const doc = clone(served);
  const strip = (c: LayoutCanvas | null | undefined) => {
    if (!c || c.derived) return null;
    const { derived: _d, ...rest } = c;
    void _d;
    return rest;
  };
  const { registryVersion: _v, ...rest } = doc;
  void _v;
  return { ...rest, canvases: { desktop: strip(doc.canvases.desktop)!, tablet: strip(doc.canvases.tablet), phone: strip(doc.canvases.phone) } };
}

/**
 * Checks a layout document for a kind of universe: its shape, then each canvas against the registry,
 * the invariants and what the page of a universe places (checkUniversePage), the derived ones
 * included. Returns the refusals, and the document with its derived canvases when there are none
 * (what checkLayout of the API answers).
 */
export function checkLayout(input: unknown, base: CheckContext): { refusals: LayoutRefusal[]; document: LayoutDocument | null } {
  const shape = checkShape(input);
  if (shape.length) return { refusals: shape, document: null };
  const doc = input as LayoutDocument;
  const context: CheckContext = { ...base, layout: { universe: doc.universe, name: doc.name } };
  const refusals: LayoutRefusal[] = [];
  const given = new Set(CANVASES.filter((n) => !!doc.canvases[n]));
  for (const name of CANVASES) {
    const canvas = doc.canvases[name];
    if (canvas) refusals.push(...checkCanvas(canvas, name, context), ...checkUniversePage(canvas, context.registry, `canvases.${name}`));
  }
  if (refusals.length) return { refusals, document: null };
  const served = deriveLayout(doc, context.registry);
  for (const name of CANVASES) {
    const canvas = served.canvases[name];
    const at = `canvases.${name}(derived)`;
    if (canvas && !given.has(name)) refusals.push(...checkCanvas(canvas, name, context, at), ...checkUniversePage(canvas, context.registry, at));
  }
  return refusals.length ? { refusals, document: null } : { refusals, document: served };
}

/**
 * A layout published before a widget joined the registry, completed (contracts/layouts.md § The
 * widget registry): each widget of a later registry version, offered in the kind of universe of the
 * layout and absent from a canvas, added there as a live button that opens in the END rail (a folded
 * rail added when the canvas has none), the other items unchanged; registryVersion the current one.
 * A widget whose "completion" is false is never added (the open votes, the members, "to handle": the
 * layouts place them).
 */
export function applyRegistry(served: LayoutDocument, registry: WidgetRegistry): LayoutDocument {
  const from = served.registryVersion ?? 1;
  if (from >= registry.registryVersion) return served;
  const doc = clone(served);
  const kind = kindOfLayout(doc.universe, doc.name);
  const added = Object.entries(registry.widgets).filter(([, w]) => (w.since ?? 1) > from && w.offeredIn.includes(kind) && w.rail && w.completion !== false);
  for (const name of CANVASES) {
    const canvas = doc.canvases[name];
    if (!canvas) continue;
    for (const [key] of added) {
      if (canvas.items.some((i) => i.widget === key)) continue;
      canvas.items.push({ widget: key, variant: 'button', rail: endRail(canvas), behavior: { kind: 'OPEN' } });
    }
  }
  return { ...doc, registryVersion: registry.registryVersion };
}

/**
 * A document served with each live button of a layout published before v79.0.0 that switches to a focus
 * that is no longer one (GOVERNANCE, AGENDA, SHOWCASE, SUB_UNIVERSES) as a live button that opens
 * (contracts/layouts.md § The layout document, items[].behavior); the document itself when it has none.
 */
export function withoutOldFocus<T extends { canvases: LayoutDocument['canvases'] }>(doc: T): T {
  const old = (i: LayoutItem) => i.behavior?.kind === 'SWITCH' && typeof i.behavior.focus === 'string' && OLD_FOCUS.includes(i.behavior.focus);
  if (!CANVASES.some((n) => (doc.canvases[n]?.items ?? []).some(old))) return doc;
  const canvases = Object.fromEntries(Object.entries(doc.canvases).map(([n, c]) => [n, c ? { ...c, items: c.items.map((i) => (old(i) ? { ...i, behavior: { kind: 'OPEN' as const } } : i)) } : c]));
  return { ...doc, canvases: canvases as T['canvases'] };
}

// ---- The reader retouches (stage 4) ----

export type RetouchCanvas = 'PHONE' | 'TABLET' | 'DESKTOP';
export type LayoutRetouch = { canvas: RetouchCanvas; widget: string; state?: 'STOWED' | 'SHOWN' | null; variant?: string | null };
const CANVAS_OF: Record<RetouchCanvas, CanvasName> = { PHONE: 'phone', TABLET: 'tablet', DESKTOP: 'desktop' };
/** Whether [widget] may take [variant] on the canvas [name] of the page of a universe (not in a rail only, nor the open votes beyond a live button). */
const onCanvas = (widget: WidgetEntry, variant: Variant, name: CanvasName) => widget.variants.includes(variant)
  && (!widget.variantCanvases?.[variant] || widget.variantCanvases[variant]!.includes(name))
  && !widget.railOnly?.includes(variant) && (widget.onUniversePage !== 'button' || variant === 'button');

/**
 * The reader retouches applied to a document as served (contracts/layouts.md § Reader retouches):
 * STOWED moves a widget to the END rail as a live button that opens; SHOWN puts a stowed widget on
 * a new row at the end of the canvas in its variant medium, else the most compact one its place
 * allows; a variant changes the variant of a widget on the canvas within its span. Each retouched
 * canvas is checked again (the invariants, the budget); an impossible retouch is
 * LAYOUT_RETOUCH_INVALID. A retouch of a widget the layout no longer has is left out (a new version
 * keeps the retouches whose widget is still there).
 */
export function applyRetouches(served: LayoutDocument, retouches: LayoutRetouch[], base: CheckContext): { document: LayoutDocument; refusals: LayoutRefusal[]; applied: LayoutRetouch[] } {
  const context: CheckContext = { ...base, layout: { universe: served.universe, name: served.name } };
  const { registry, kind } = context;
  const doc = clone(served);
  const refusals: LayoutRefusal[] = [];
  const applied: LayoutRetouch[] = [];
  if (retouches.length > RETOUCHES_MAX) return { document: served, refusals: [{ code: 'LAYOUT_RETOUCH_INVALID', path: 'retouches' }], applied };
  const touched = new Set<CanvasName>();
  retouches.forEach((r, i) => {
    const path = `retouches[${i}]`;
    const name = CANVAS_OF[r.canvas];
    const canvas = name ? doc.canvases[name] : undefined;
    const widget = registry.widgets[r.widget];
    if (!canvas || !widget || (!r.state && !r.variant)) { refusals.push({ code: 'LAYOUT_RETOUCH_INVALID', path, widget: r.widget }); return; }
    if (widget.ignored) return; // a widget no layout places any more (the live line since v99.0.0): left out
    const index = canvas.items.findIndex((it) => it.widget === r.widget);
    if (index < 0) return; // no longer in the layout: left out
    const item = canvas.items[index];
    const required = widget.requiredIn.includes(kind);
    if (r.state === 'STOWED') {
      if (item.rail !== undefined) { applied.push(r); return; }
      if (required || !widget.rail) { refusals.push({ code: 'LAYOUT_RETOUCH_INVALID', path, widget: r.widget }); return; }
      canvas.items[index] = stowed(item, endRail(canvas));
    } else if (r.state === 'SHOWN') {
      if (placed(item)) { applied.push(r); return; }
      const last = canvas.items.filter(placed).reduce((m, it) => Math.max(m, (it.row ?? 1) + (it.rows ?? 1) - 1), 0);
      const options = (['medium', 'compact', 'button', 'wide', 'full'] as Variant[]).filter((v) => onCanvas(widget, v, name));
      const variant = options[0];
      if (!variant) { refusals.push({ code: 'LAYOUT_RETOUCH_INVALID', path, widget: r.widget }); return; }
      const span = spanOf(registry, widget, variant, canvas.columns) ?? [1, canvas.columns];
      const { rail: _rail, behavior: _b, ...rest } = item;
      void _rail; void _b;
      canvas.items[index] = { ...rest, variant, row: last + 1, col: 1, cols: variant === 'full' ? canvas.columns : span[0] };
    }
    if (r.variant) {
      const now = canvas.items[index];
      const variant = r.variant as Variant;
      const limited = widget.variantCanvases?.[variant];
      if (required || !placed(now) || !widget.variants.includes(variant) || variant === 'hidden' || (limited && !limited.includes(name)) || !onCanvas(widget, variant, name)) { refusals.push({ code: 'LAYOUT_RETOUCH_INVALID', path, widget: r.widget }); return; }
      const span = spanOf(registry, widget, variant, canvas.columns);
      if (!span) { refusals.push({ code: 'LAYOUT_RETOUCH_INVALID', path, widget: r.widget }); return; }
      const cols = Math.min(Math.max(now.cols ?? span[0], span[0]), span[1]);
      if ((now.col ?? 1) + cols - 1 > canvas.columns) { refusals.push({ code: 'LAYOUT_RETOUCH_INVALID', path, widget: r.widget }); return; }
      canvas.items[index] = { ...now, variant, cols };
    }
    touched.add(name);
    applied.push(r);
  });
  for (const name of touched) {
    const canvas = doc.canvases[name];
    if (canvas) refusals.push(...checkCanvas(canvas, name, context), ...checkUniversePage(canvas, registry, `canvases.${name}`));
  }
  return { document: refusals.length ? served : doc, refusals, applied };
}

// ---- The pages of a universe (since design v2.9.0) ----
//
// Specs v49.9.0 to v50.1.0 (contracts/layouts.md § The governance page, § The pages of a universe,
// § The free blocks, § The navigation widget; governance-page.feature, universe-pages.feature): the
// check of the canvases of a layout for its page (the page of a universe, the governance page and
// its invariants G2 to G4, a custom page and the free blocks of the about page with P2 to P6) and the
// derivation of the canvases of a page that is not the page of a universe (the tablet without the
// widget budget, the phone one item per row in the reading order). What needs more than the layout
// (the names of the pages of the universe, their canonical form, the content of a free block, the
// images and targets it names) is given by the caller (PageHooks): the backend checks it.

/** The free blocks (since specs v49.10.0): the widgets of the registry marked freeBlock (on the theme surface "block" before design v4.0.0). */
export const FREE_BLOCKS = ['textBlock', 'imageBlock', 'linkBlock', 'channelBlock', 'buttonBlock', 'separatorBlock', 'spaceBlock'] as const;
export type FreeBlock = (typeof FREE_BLOCKS)[number];
export const isFreeBlock = (widget: string): widget is FreeBlock => (FREE_BLOCKS as readonly string[]).includes(widget);
/** The six widgets of the governance page (since specs v49.9.0). */
export const GOVERNANCE_WIDGETS = ['openVotes', 'proposals', 'myDuties', 'rules', 'pinnedChannels', 'governanceHistory'] as const;
/**
 * The page a layout of the format 1 is for (the field "page", "home" when absent): the page of a
 * universe or the governance page; the agenda, members and about pages for the platform layouts only.
 */
export type LayoutPage = 'home' | 'governance' | 'agenda' | 'members' | 'about';
export const LAYOUT_PAGES: readonly LayoutPage[] = ['home', 'governance', 'agenda', 'members', 'about'];
/** What a canvas is checked as: the page of a layout, a custom page, or the free blocks of the about page (published with the name "about"). */
export type PageCheck = LayoutPage | 'custom' | 'aboutBlocks';
const withBlocks = (page: PageCheck) => page === 'custom' || page === 'aboutBlocks';

/**
 * The limits of the back office (client configuration universePages.limits.*), with their defaults;
 * [kept]: the items of each canvas of the version published before (a limit lowered keeps the
 * canvases published and refuses a new item beyond it).
 */
export type PageLimits = { maxCustomPages: number; maxItemsPerCanvas: number; kept?: Partial<Record<CanvasName, number>> };
export const DEFAULT_PAGE_LIMITS: PageLimits = { maxCustomPages: 10, maxItemsPerCanvas: 40 };
/** A refusal of the check of a page, with the limit it names (CANVAS_ITEMS_LIMIT). */
export type PageRefusal = LayoutRefusal & { limit?: number };
/** An item of a page: a free block with its id and content (the document break-rocks-layout/3). */
export type PageItem = LayoutItem & { id?: string; content?: unknown };
/**
 * What the caller gives to check what the layout alone does not say: [pages], the canonical names of
 * the pages of the universe (the targets of a secondary menu), [pageKey] the canonical form of a page
 * named (the name itself when absent), [content] the check of the content of a free block (with the
 * canvases given only, not the derived ones).
 */
export type PageHooks = { pages?: Set<string>; pageKey?: (name: string) => string; content?: (item: PageItem, path: string) => PageRefusal[] };

/** The invariants of the shared library the free blocks of the about page are not held to (those of its platform layout). */
const ABOUT_BLOCKS_LIFTED = ['LAYOUT_IDENTITY_REQUIRED', 'LAYOUT_FEED_REQUIRED', 'LAYOUT_RULES_POST_REQUIRED'];
const BLOCK_ID = /^[A-Za-z0-9_-]{1,32}$/;

/**
 * The registry the canvases of a governance page or of a custom page are checked and derived with:
 * no widget budget (G4, P3), and the feed, the time column, the rules post and the widgets of the
 * governance page required nowhere (G3, P2: their own invariants answer).
 */
export function pageRegistry(registry: WidgetRegistry): WidgetRegistry {
  const breakpoints = Object.fromEntries(Object.entries(registry.breakpoints).map(([k, b]) => [k, { ...b, budget: Number.MAX_SAFE_INTEGER }])) as WidgetRegistry['breakpoints'];
  const widgets = { ...registry.widgets };
  for (const w of ['feed', 'timeColumn', 'rulesPost', ...GOVERNANCE_WIDGETS]) if (widgets[w]) widgets[w] = { ...widgets[w], requiredIn: [] };
  return { ...registry, breakpoints, widgets };
}

/** The registry the free blocks of the about page are checked and derived with: nothing required (the identity bar is that of the platform layout "about"; the time strip is drawn by the apps). */
export function blocksRegistry(registry: WidgetRegistry): WidgetRegistry {
  const reg = pageRegistry(registry);
  return { ...reg, widgets: Object.fromEntries(Object.entries(reg.widgets).map(([k, w]) => [k, { ...w, requiredIn: [] }])) };
}

/** The item as checkShape and checkCanvas know it: without the id and content of a free block, nor the pages and rail of a menu (checked by pageInvariants). */
export function withoutPageFields(item: PageItem): LayoutItem {
  const { id: _i, content: _c, ...rest } = item;
  void _i; void _c;
  if (item.widget === 'navigation' && item.params) {
    const { pages: _p, railId: _r, ...params } = item.params as Record<string, unknown>;
    void _p; void _r;
    return { ...rest, params };
  }
  return rest;
}

/** Whether a text block has a heading of level 2 (P5). */
export const hasHeading2 = (text: string) => /^## \S/m.test(text.normalize('NFC').replace(/\r\n?/g, '\n'));

/**
 * The invariants of [canvas] for its page and what the pages add to every canvas (the navigation
 * widget, the limit of items): G2 and G3 on the governance page, P2 to P6 on a custom page and the
 * free blocks of the about page; on the page of a universe, no free block.
 */
export function pageInvariants(canvas: LayoutCanvas, name: CanvasName, at: string, page: PageCheck, kind: UniverseKind, limits: PageLimits, hooks: PageHooks = {}, registry?: WidgetRegistry): PageRefusal[] {
  const out: PageRefusal[] = [];
  const refuse = (code: string, path: string, widget?: string, extra: Partial<PageRefusal> = {}) => { out.push({ code, path, ...(widget ? { widget } : {}), ...extra }); };
  const key = hooks.pageKey ?? ((n: string) => n);
  const items = canvas.items as PageItem[];
  items.forEach((item, i) => {
    const path = `${at}.items[${i}]`;
    const free = isFreeBlock(item.widget);
    if (!withBlocks(page) && free) refuse('LAYOUT_WIDGET_NOT_ON_PAGE', `${path}.widget`, item.widget);
    // The free blocks of the about page: free blocks only (the widgets are those of the platform layout "about").
    if (page === 'aboutBlocks' && !free) refuse('LAYOUT_WIDGET_NOT_ON_PAGE', `${path}.widget`, item.widget);
    if (page !== 'home' && (item.widget === 'feed' || item.widget === 'timeColumn')) refuse('LAYOUT_WIDGET_NOT_ON_PAGE', `${path}.widget`, item.widget);
    // An id or a content on a widget that is no free block (a widget the registry does not know: LAYOUT_WIDGET_UNKNOWN from checkCanvas).
    if ((item.id !== undefined || item.content !== undefined) && !free && (!registry || registry.widgets[item.widget])) refuse('LAYOUT_FORMAT_INVALID', path, item.widget);
    if (free && (item.rows ?? 1) > 4) refuse('LAYOUT_SPAN_INVALID', `${path}.rows`, item.widget);
    if (item.widget === 'navigation') {
      const p = (item.params ?? {}) as Record<string, unknown>;
      if (p.format === 'bottomBar' && canvas.columns !== 4) refuse('NAVIGATION_FORMAT_INVALID', `${path}.params.format`, item.widget);
      // A menu in a widget rail names a rail of its canvas (a format "rail" without railId is refused too).
      if ((p.railId !== undefined || p.format === 'rail') && !(typeof p.railId === 'string' && (canvas.rails ?? []).some((r) => r.id === p.railId))) refuse('LAYOUT_RAIL_INVALID', `${path}.params.railId`, item.widget);
      if (p.role === 'secondary') {
        const list = p.pages;
        if (!Array.isArray(list) || !list.length || list.length > 20 || !list.every((n) => typeof n === 'string' && (!hooks.pages || hooks.pages.has(key(n))))) refuse('BLOCK_LINK_INVALID', `${path}.params.pages`, item.widget);
      } else if (p.pages !== undefined) refuse('LAYOUT_PARAM_INVALID', `${path}.params.pages`, item.widget);
    }
    if (free && withBlocks(page) && hooks.content) out.push(...hooks.content(item, path));
  });
  const mains = items.filter((i) => i.widget === 'navigation' && placed(i) && ((i.params as Record<string, unknown> | undefined)?.role ?? 'main') === 'main');
  if (mains.length > 1) refuse('NAVIGATION_MAIN_DUPLICATE', at, 'navigation');
  // A limit lowered below a canvas published keeps it: no more items than it had.
  if (items.length > Math.max(limits.maxItemsPerCanvas, limits.kept?.[name] ?? 0)) refuse('CANVAS_ITEMS_LIMIT', at, undefined, { limit: limits.maxItemsPerCanvas });
  if (page === 'governance') {
    const required = [...(kind === 'public' ? ['openVotes', 'proposals'] : []), 'rules', ...(kind === 'private' ? ['pinnedChannels'] : [])];
    for (const w of required) {
      const shown = items.some((i) => i.widget === w && placed(i) && ['full', 'wide', 'medium', 'compact'].includes(i.variant));
      if (!shown) refuse('LAYOUT_GOVERNANCE_BLOCK_REQUIRED', at, w);
    }
  }
  if (withBlocks(page)) {
    const texts = items.filter((i) => i.widget === 'textBlock' && isObject(i.content) && typeof (i.content as Record<string, unknown>).text === 'string');
    // P5: a heading of level 2 among the text blocks, when there are text blocks.
    if (texts.length && !texts.some((i) => hasHeading2((i.content as { text: string }).text))) refuse('PAGE_HEADING_REQUIRED', at, 'textBlock');
    const ids = new Set<string>();
    items.forEach((item, i) => {
      if (!isFreeBlock(item.widget) || item.id === undefined) return;
      if (typeof item.id !== 'string' || !BLOCK_ID.test(item.id)) refuse('LAYOUT_FORMAT_INVALID', `${at}.items[${i}].id`, item.widget);
      else if (ids.has(item.id)) refuse('LAYOUT_ITEMS_OVERLAP', `${at}.items[${i}].id`, item.widget);
      else ids.add(item.id);
    });
  }
  return out;
}

/** A widget of a page as a live button that opens, in the rail [rail]: its parameters, id and content kept. */
function stowedOnPage(item: PageItem, rail: string): PageItem {
  const { row: _r, col: _c, cols: _n, rows: _m, gestures: _g, surface: _s, behavior: _b, ...rest } = item;
  void _r; void _c; void _n; void _m; void _g; void _s; void _b;
  const params = item.widget === 'navigation' && (rest.params as Record<string, unknown> | undefined)?.railId !== undefined ? { params: { ...(rest.params as Record<string, unknown>), railId: rail } } : {};
  return { ...rest, ...params, variant: 'button', rail, behavior: { kind: 'OPEN' } };
}

/**
 * The phone canvas of a governance page or of a custom page derived from its desktop canvas
 * (contracts/layouts.md § The governance page, Derivation): one item per row, in the variant full,
 * in the reading order of the desktop canvas (a free block keeps its rows), the items in a rail live
 * buttons that open in one END rail; the hidden ones stay hidden.
 */
export function derivePagePhone(desktop: LayoutCanvas, registry: WidgetRegistry): LayoutCanvas {
  const columns = registry.breakpoints.phone?.columns ?? 4;
  const canvas: LayoutCanvas = { columns, items: [], rails: [], derived: true, addressBar: 'top' };
  let row = 1;
  const items = kept(registry, desktop.items as PageItem[]);
  for (const item of readingOrder(items.filter(placed))) {
    const widget = registry.widgets[item.widget];
    const variant: Variant = !widget || widget.variants.includes('full') ? 'full' : item.variant;
    const { rows, rail: _rail, behavior: _b, gestures: _g, ...rest } = clone(item);
    void _rail; void _b; void _g;
    const keepRows = isFreeBlock(item.widget) && rows && rows > 1 ? rows : undefined;
    // A menu whose pages are live buttons in a rail of the desktop canvas: in the END rail of the phone.
    const params = item.widget === 'navigation' && (item.params as Record<string, unknown> | undefined)?.format === 'rail' ? { params: { ...(rest.params as Record<string, unknown>), railId: 'end' } } : {};
    canvas.items.push({ ...rest, ...params, variant, row, col: 1, cols: columns, ...(keepRows ? { rows: keepRows } : {}) });
    row += keepRows ?? 1;
  }
  const inRails = items.filter((i) => i.rail !== undefined);
  const railMenu = canvas.items.some((i) => i.widget === 'navigation' && (i.params as Record<string, unknown> | undefined)?.railId === 'end');
  if (inRails.length || railMenu) canvas.rails = [{ id: 'end', side: 'END', folded: true }];
  if (inRails.length) {
    const order = (side: string) => inRails.filter((i) => (desktop.rails ?? []).find((r) => r.id === i.rail)?.side === side);
    const rest = inRails.filter((i) => !(desktop.rails ?? []).some((r) => r.id === i.rail));
    for (const item of [...order('START'), ...order('END'), ...order('BOTTOM'), ...rest]) canvas.items.push(stowedOnPage(clone(item), 'end'));
  }
  for (const item of items.filter((i) => i.rail === undefined && i.variant === 'hidden')) canvas.items.push(clone(item));
  return canvas;
}

/** The document as served of a governance page or a custom page: the canvases left null derived (the tablet without budget, the phone one item per row). */
export function derivePage<T extends { derive?: boolean; canvases: LayoutDocument['canvases'] }>(doc: T, registry: WidgetRegistry, kind: UniverseKind): T {
  const out = clone(doc);
  const reg = pageRegistry(registry);
  const desktop: LayoutCanvas = { ...out.canvases.desktop, derived: false };
  const own = (c: LayoutCanvas | null | undefined) => (c ? { ...c, derived: false } : null);
  const derive = out.derive !== false;
  const tablet = own(out.canvases.tablet) ?? (derive ? deriveTablet(desktop, reg, kind) : null);
  const phone = own(out.canvases.phone) ?? (derive ? derivePagePhone(desktop, reg) : null);
  return { ...out, derive, canvases: { desktop, tablet, phone } };
}

/**
 * The canvases of a page checked: each canvas given against the registry (checkCanvas, its items
 * without the fields of a page) and the invariants of its page, then the derived ones; the document as
 * served when nothing is refused (the page of a universe: the document itself, deriveLayout serves it).
 */
export function checkPageCanvases<T extends { derive?: boolean; canvases: LayoutDocument['canvases'] }>(
  doc: T, page: PageCheck, context: PageHooks & { kind: UniverseKind; registry: WidgetRegistry; limits?: PageLimits },
): { refusals: PageRefusal[]; document: T | null } {
  const { kind } = context;
  const limits = context.limits ?? DEFAULT_PAGE_LIMITS;
  const registry = page === 'aboutBlocks' ? blocksRegistry(context.registry) : context.registry;
  const reg = page === 'home' ? registry : pageRegistry(registry);
  const refusals: PageRefusal[] = [];
  const given = new Set(CANVASES.filter((n) => !!doc.canvases[n]));
  const checkOne = (canvas: LayoutCanvas, name: CanvasName, at: string, withContent: boolean) => {
    const hooks: PageHooks = { pages: context.pages, pageKey: context.pageKey, content: withContent ? context.content : undefined };
    const mine = pageInvariants(canvas, name, at, page, kind, limits, hooks, reg);
    const shared = checkCanvas({ ...canvas, items: (canvas.items as PageItem[]).map(withoutPageFields) }, name, { kind, registry: reg }, at)
      // The feed is not required on these pages (G3, P2); the free blocks of the about page are drawn under the identity bar of its platform layout and the time strip.
      .filter((r) => page === 'home' || r.code !== 'LAYOUT_FEED_REQUIRED')
      .filter((r) => page !== 'aboutBlocks' || !ABOUT_BLOCKS_LIFTED.includes(r.code));
    // The open votes beyond a live button, on a page that is not the governance page.
    const elsewhere = page === 'governance' ? [] : checkUniversePage(canvas, reg, at);
    return [...mine, ...shared, ...elsewhere];
  };
  for (const name of CANVASES) {
    const canvas = doc.canvases[name];
    if (canvas) refusals.push(...checkOne(canvas, name, `canvases.${name}`, true));
  }
  if (refusals.length) return { refusals, document: null };
  if (page === 'home') return { refusals, document: doc };
  const served = derivePage(doc, registry, kind);
  for (const name of CANVASES) {
    const canvas = served.canvases[name];
    if (canvas && !given.has(name)) refusals.push(...checkOne(canvas, name, `canvases.${name}(derived)`, false));
  }
  return refusals.length ? { refusals, document: null } : { refusals, document: served };
}

/**
 * Checks a platform layout of a page other than the page of a universe (the field "page": governance,
 * agenda, members, about; layouts/platform/): its shape, then checkPageCanvases for the kind of
 * universe of its name (agenda, members and about: public). Returns the document as served: its
 * canvases derived, its page and registryVersion.
 */
export function checkPageLayout(input: unknown, base: { registry: WidgetRegistry; kind?: UniverseKind; limits?: PageLimits }): { refusals: PageRefusal[]; document: (LayoutDocument & { page: LayoutPage }) | null } {
  if (!isObject(input)) return { refusals: checkShape(input), document: null };
  const { page, ...rest } = input as Record<string, unknown>;
  if (!LAYOUT_PAGES.includes(page as LayoutPage) || page === 'home') return { refusals: [{ code: 'LAYOUT_PAGE_INVALID', path: 'page' }], document: null };
  const canvases = isObject(rest.canvases)
    ? Object.fromEntries(Object.entries(rest.canvases).map(([k, c]) => [k, isObject(c) && Array.isArray(c.items) ? { ...c, items: (c.items as unknown[]).map((i) => (isObject(i) ? withoutPageFields(i as PageItem) : i)) } : c]))
    : rest.canvases;
  const shape = checkShape({ ...rest, canvases });
  if (shape.length) return { refusals: shape, document: null };
  const doc = rest as unknown as LayoutDocument;
  const kind = base.kind ?? (page === 'governance' ? kindOfLayout(doc.universe, doc.name) : 'public');
  const checked = checkPageCanvases(doc, page as LayoutPage, { kind, registry: base.registry, limits: base.limits });
  return checked.document ? { refusals: [], document: { ...checked.document, page: page as LayoutPage, registryVersion: base.registry.registryVersion } } : { refusals: checked.refusals, document: null };
}
