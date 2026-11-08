# break-rocks-design-lib

> **Generated from break-rocks-design v4.2.0. Do not edit by hand**: every change is made in the design system
> and comes here with its next version (`scripts/publish-lib.mjs` there). Issues and pull requests here are not
> merged.

The public subset of the [break.rocks](https://break.rocks) design system: what the public clients (the
`breakrocks` CLI among them) need to read a theme and check a layout as the platform does, offline.

| Path | What |
|---|---|
| `lib/theme/index.ts` | The shared library of the themes: `readTheme`, `themeHooks`, `maskOpacity`, `monogramColor`… |
| `lib/layout/index.ts` | The shared library of the layouts: `checkLayout`, `deriveLayout`, `applyRegistry`, `applyRetouches`… (no dependency, no import) |
| `schemas/` | The JSON Schemas of a theme (`break-rocks-theme/2`) and of a layout (`break-rocks-layout/1`) |
| `registry/widgets.json` | The widget registry |
| `layouts/platform/` | The platform layouts |
| `examples/themes/`, `examples/layouts/` | Valid examples, and in `invalid/` the refused cases named by what refuses them |
| `dist/web/tokens.ts`, `dist/web/tokens.css` | The web tokens of the design system (Socle, Strates, Pupitre), as the apps ship them |

## Use

TypeScript in the syntax Node strips as it is (no build, Node 24 or later), for Node, a bundler (esbuild,
Vite) or `tsc` with `allowImportingTsExtensions`. Mount it as a git submodule pinned on a tag:

```sh
git submodule add https://github.com/break-rocks/break-rocks-design-lib.git design-lib
git -C design-lib checkout v4.2.0
```

```ts
import registry from './design-lib/registry/widgets.json' with { type: 'json' };
import { checkLayout, kindOfLayout, type WidgetRegistry } from './design-lib/lib/layout/index.ts';
import { readTheme } from './design-lib/lib/theme/index.ts';
```

The package is `@breakrocks/design-lib` (`exports`: `./theme`, `./layout`, `./tokens`, `./tokens.css`,
`./schemas/*`, `./registry/*`, `./layouts/platform/*`, `./examples/*`) but it is **not published to npm**;
Node does not strip types under `node_modules` anyway.

## Tests

```sh
npm test
```

## Versions

The version of the design system it comes from (semantic versioning, tags `vMAJOR.MINOR.PATCH`):
major when an export, a token or a resource is renamed or deleted, minor for an addition, patch for a value
adjusted. `CHANGELOG.md` keeps the entries that touch what is here.

## Reference

The sections of the README of the design system that describe what is here. Links to its other sections (the
theme surfaces, the contrast, the grid…) point to the design system, which is not public.

### Theme and layout documents

Since v2.2.0, the formats of specs v48.0.0 as files that the backend, the shared library of the
layout derivation, the theme studio and both apps read the same way:

| File | What |
|---|---|
| `schemas/theme-v2.schema.json` | JSON Schema (draft 2020-12) of a theme, `break-rocks-theme/2` (`contracts/themes.md` § Format 2): the palette and the theme surfaces per variant (since v4.0.0 the four families; the former theme surfaces, their `border`, `surfaceRadius`, `shape`, `typography.accent`, the image slots and scrims other than `page`, `pageHeader` and `mask` accepted and marked `deprecated`, ignored when read), the typography (the title typeface, no body typeface), the image slots, the scrims (served only, `mask` since v4.0.0). It accepts a theme of the format `break-rocks-theme/1` unchanged (`format` picks the branch): a valid theme of the format 1 stays valid, and the keys of the format 2 are refused in it. |
| `schemas/layout-v1.schema.json` | JSON Schema of a layout document, `break-rocks-layout/1` (`contracts/layouts.md`): `derive`, the desktop, tablet and phone canvases (4, 8 or 12 columns, `addressBar` on the phone only), the items (a widget of the registry, its widget variant, `row`, `col`, `cols`, `rows`, `params`, `gestures`, `rail`, `behavior`, `contextual`, `surface`), the widget rails (`folded`, and `pinned` since v2.6.0, specs v69.0.0); `page` since v2.9.0 (`home` by default, `governance`, and `agenda`, `members`, `about` for the platform layouts). It carries no color, typeface nor image. |
| `registry/widgets.json` | The widget registry as data (`registryVersion` 3 since v2.6.0, specs v71.0.0; the parameters of the map widget since v2.4.0, specs v49.8.0): the breakpoints with their columns and widget budget, the widget variants and their spans by columns, the widget actions, the gestures, the behaviors, the sides of a rail; per widget, its theme surfaces, its widget variants (and the canvases a variant is limited to), its parameters with their values and default, its live content, the universes it is offered and required in, whether it goes in a rail, its contextual condition; `since`, the version it joined in, and `completion: false` for a widget never added to a layout published before (see [The registry version 3](#the-registry-version-3)); since v2.9.0, the free blocks and the navigation widget (see [The pages of a universe](#the-pages-of-a-universe)). |
| `registry/page-icons.json` | Since v2.9.0: the icons of the custom pages (`break-rocks-page-icons/1`), a closed list of 52 names (`PAGE_ICON_INVALID`); each app draws them with its own icon set. |
| `layouts/platform/` | The platform layouts as documents of `%root` (`derive: false`, their three canvases): `feed-first`, `village-square`, `studio`, `agora`, `hud` (shown "dashboard", since v2.6.0, specs v69.0.0), and the private canvases `feed-first-private` and `studio-private`; since v2.9.0, the layouts of the other pages of a universe (`page`, desktop canvas only, `derive: true`): `governance` and `governance-private`, `agenda`, `members`, `about`. |
| `examples/themes/`, `examples/layouts/` | Valid examples (a theme of the format 2 on the four families, the same written before v4.0.0 with the former theme surfaces, radii, stroke and accent typeface (`faille-v48`, valid and read into the families), one of the format 1, a personal theme; feed first of v46.0.0 as a layout of a universe with its desktop canvas only, the `plaza` example of the contract), and in `invalid/` the refused cases, named by what refuses them: `schema.<case>.json` the schema, `<CODE>.json` the check of the layout with that code. |

The schemas give the **structure** only. The backend also checks at publication what needs more
than the document: the contrast raised to AA by theme surface, the size (64 KB), the images (at most
8, each at most 5 MB, uploaded), the approved typefaces, the uniqueness of a name and its lookalikes,
the use (a universe theme gives the six colors of its palette, a personal theme its accent only); it
computes the scrims and the screenshots, which a served document carries and an input must not
(`THEME_SCRIMS_COMPUTED`, `THEME_SCREENSHOTS_GENERATED`, `LAYOUT_SCREENSHOTS_GENERATED`).

What a layout needs beyond its structure is checked by `checkLayout` of the shared library of the
layouts (below), with the codes of the contract: the variants of each widget
(`LAYOUT_VARIANT_NOT_ALLOWED`), the spans (`LAYOUT_SPAN_INVALID`), the overlaps, the rails, the
behaviors, the contextual widgets, the gestures, the parameters, the invariants 1 and 3 to 7 (identity
bar, time column in a public universe, feed and its half of the columns, rules post before the feed in a
public universe and the root universe, widget budget; invariant 2, the live line, withdrawn since v4.2.0,
specs v99.0.0) and `LAYOUT_CANVAS_MISSING`, on the
canvases given and on the derived ones. A layout of `%root` is checked as for a public universe and
the root universe, the `-private` ones as for a private universe (specs v48.0.1). A required widget
hidden or stowed in a rail is refused by its invariant only ("the feed is always on the page").

### The shared library of the themes

Since v4.0.0, `lib/theme/index.ts`, in the same syntax as the layouts (TypeScript Node strips, no build), for
the backend, the web and the tools; Flutter, iOS and Android take the same data from `BrSurfaceFamily`:

| Export | What |
|---|---|
| `readTheme(document)` | A theme document (format 1 or 2) read as the apps draw it: per variant the palette and the four families (a family given as is; else the first former theme surface of its row given; its `border` dropped), the title typeface, the image slots `page` and `pageHeader`, the scrims (`mask` among them), and `ignored`, the paths it ignored: the removed and the shadowed former theme surfaces, `border`, `surfaceRadius`, `shape`, `typography.accent`, the other image slots and scrims. It never refuses: the schema does. |
| `themeHooks(read, variant)` | The CSS hooks `--theme-surface-<family>-<bg/text/muted>` of a variant read, to set on `.universe-themed` |
| `maskOpacity({ page, texts, pixels, floor, step })` | The AA rule of the readability mask: the lowest opacity (a multiple of `step`) of the color of the page at which every text keeps its minimum over every pixel, at least `floor`, at most 1 |
| `monogramColor`, `hueOfColor`, `families`, `formerSurfaces`, `removedSurfaces` | From `dist/web/tokens.ts`, again |

Tests: `node --test lib/theme/theme.test.ts`.

### The shared library of the layouts

Since v2.3.0, `lib/layout/index.ts`: the one implementation of `contracts/layouts.md` § The layout
document, § Invariants, § Layout derivation and § Reader retouches, in TypeScript without dependency
and in one file without import, written in the syntax Node strips as it is (no enum, no namespace),
so that every client imports it from its submodule `design/` at its pinned tag, without a build.
Since v4.2.0 (specs v99.0.0, D-293, contracts/layouts.md § Since v99.0.0), the live line is merged into the
time strip, which the apps draw at the head of the content column of every universe page, never placed by a
layout. Expand then contract (D-203):

- invariant 2 is withdrawn: `LAYOUT_LIVE_LINE_REQUIRED` is no longer raised (by `checkLayout`, the pages,
  the reader retouches);
- the registry keeps the key `liveLine`, marked `"ignored": true` (no family, no variant, offered and
  required nowhere): a document published before that places it still passes, its placement ignored, not
  checked (variant, span, overlap, rail, gestures), not counted in the widget budget, left out of the derived
  tablet and phone canvases (`deriveTablet`, `derivePhone`, `derivePagePhone`), a reader retouch of it left
  out; the canvases given are served as published, so an app reads the item and draws nothing for it;
- the action `turn` is withdrawn: still accepted by the shape and the schema (a gesture of such a document,
  on the live line, ignored), refused on any widget placed (`LAYOUT_GESTURE_INVALID`); `step` is the
  action of the time strip, drawn by the apps, and no widget takes it either;
- the platform layouts (`layouts/platform/`) and the examples no longer place the live line (their rows
  closed up); `examples/layouts/published-before-v99.json` keeps one, with `turn` and `step`, and passes;
  `isIgnored(registry, item)` tells such an item.

Usage:

```ts
import registry from '<design>/registry/widgets.json';
import { checkLayout, deriveLayout, applyRegistry, applyRetouches, kindOfLayout, type WidgetRegistry } from '<design>/lib/layout/index.ts';

const { refusals, document } = checkLayout(input, { kind: kindOfLayout(input.universe, input.name), registry: registry as WidgetRegistry });
```

| Export | What |
|---|---|
| `checkLayout(document, { kind, registry })` | The refusals (`{ code, path, widget? }`) of the shape (what the schema says, as codes: `LAYOUT_FORMAT_INVALID`, `LAYOUT_TOO_LARGE`, `LAYOUT_NAME_INVALID`, `LAYOUT_DESCRIPTION_TOO_LONG`, `LAYOUT_DESKTOP_MISSING`, `LAYOUT_COLUMNS_INVALID`, `LAYOUT_FRAME_INVALID`…), then of each canvas given against the registry and the invariants, then of each derived canvas (path `canvases.phone(derived)`); and, when there are none, the document as served (`deriveLayout`). What it cannot know stays with the backend: a name unique in its universe and its lookalikes, the 20 layouts of an account, the screenshots |
| `deriveLayout(document, registry)` | The document as served: the canvases left `null` derived from the desktop one (when `derive` is not `false`), each canvas with `derived`, `registryVersion` the version of the registry |
| `deriveTablet`, `derivePhone` | The two derivations alone (§ Layout derivation, 2 and 3): the tablet keeps the rows and the order, each item over `round(cols × 8 / columns)` (the feed at least 4) in the variant whose span holds it, the items that no longer fit on a new row under theirs, the last widgets beyond the budget of 6 as live buttons of the `END` rail; the phone one item per row at the full width (the universe banner and the head row when the desktop shows them, the identity bar, the time column as a live button, the rules post, the feed; the live line until v4.2.0), every other widget a live button that opens in one folded `END` rail, a widget without a live button (its variants `full` and `hidden` only: the pulse, the welcome wall, the layout switcher) hidden; since v4.2.0, an ignored widget (`liveLine`) left out of both |
| `applyRegistry(served, registry)` | A document served for an older registry completed: each widget of a later version (`since` in the registry, 1 when absent) offered in the kind of the layout and absent from a canvas, a live button that opens in its `END` rail (a folded rail added when there is none), the rest unchanged |
| `applyRetouches(served, retouches, { kind, registry })` | The reader retouches (`{ canvas: PHONE \| TABLET \| DESKTOP, widget, state: STOWED \| SHOWN, variant }`, at most 50), each retouched canvas checked again; an impossible retouch is `LAYOUT_RETOUCH_INVALID`, a retouch of a widget the layout no longer has is left out |
| `checkUniversePage(canvas, registry, at)` | Since v2.6.0: what the page of a universe does not place, `LAYOUT_WIDGET_NOT_ON_PAGE` (the open votes in another variant than `button` or `hidden`); run by `checkLayout` and `applyRetouches`, not by `checkCanvas`, which a page that places them (the governance page of the backend) runs too |
| `withoutOldFocus(served)` | Since v2.7.0: a document served with each live button that switches to a focus of before specs v79.0.0 (`OLD_FOCUS`: `GOVERNANCE`, `AGENDA`, `SHOWCASE`, `SUB_UNIVERSES`) as a live button that opens; the document itself when it has none |
| `checkPageCanvases(document, page, { kind, registry, limits?, pages?, pageKey?, content? })` | Since v2.9.0: the canvases of a page checked (`home`, `governance`, `custom`, `aboutBlocks`; the invariants G2 to G4 and P2 to P6, the navigation widget, `CANVAS_ITEMS_LIMIT`) and, for a page other than `home`, derived (`derivePage`: the tablet without widget budget, the phone one item per row); the content of a free block and the names of the pages are checked by the hooks the caller gives |
| `checkPageLayout(document, { registry })` | Since v2.9.0: a platform layout with a `page` other than `home`, its shape then `checkPageCanvases`; the document as served with its `page` and `registryVersion` |
| `isIgnored(registry, item)` | Since v4.2.0: whether an item places a widget no layout places any more (`ignored` in the registry: the live line since specs v99.0.0), its placement ignored |
| `pageInvariants`, `pageRegistry`, `blocksRegistry`, `derivePage`, `derivePagePhone`, `withoutPageFields`, `FREE_BLOCKS`, `isFreeBlock`, `GOVERNANCE_WIDGETS`, `LAYOUT_PAGES`, `DEFAULT_PAGE_LIMITS` | The steps of the pages |
| `checkShape`, `checkCanvas`, `publishedOf`, `readingOrder`, `spanOf`, `fullOnly`, `kindOfLayout` | The steps above, the document as published from the one served, the reading order, the spans |

`node --test lib/layout/layout.test.ts` tests it: the seven platform layouts of the page of a universe and the examples pass and
are served as frozen in `lib/layout/snapshots/` (`platform.<name>.json` as given,
`derived.<name>.json` derived from their desktop canvas alone, `example.<name>.json`; written again
with `UPDATE_SNAPSHOTS=1`, read in review), the tablet each platform layout gives is the one the
derivation computes from its desktop, every invalid example is refused with its code; the five
layouts of the other pages pass `checkPageLayout` and are served as frozen in `page.<name>.json`.
`scripts/check-documents.mjs` checks the documents with it (the build stops on a failure).

#### The registry version 3

Since v2.6.0 (specs v69.0.0 to v71.0.0, D-188 to D-190: `contracts/layouts.md` § The dashboard, §
The widget registry, § The governance page; `dashboard-layout.feature`, `widgets.feature`,
`universe-layouts.feature`), the registry is at `registryVersion` 3 and the library reads what it
adds:

- **The widgets of the governance page** (`since: 2`): `openVotes`, `proposals`, `myDuties`, `rules`,
  `pinnedChannels`, `governanceHistory`. The open votes are placed on the page of a universe as a
  live button only (`onUniversePage: "button"`, `LAYOUT_WIDGET_NOT_ON_PAGE`); the governance page
  itself, its invariants G1 to G4 and its derivation stay with the backend.
- **The widgets of the dashboard** (`since: 3`): `members` and `toHandle`, live buttons only
  (`button`, `hidden`), in a public universe; the layout places both, the app shows the one the
  reader's role calls for.
- **Not completed**: `openVotes`, `members` and `toHandle` carry `completion: false`, so that
  `applyRegistry` never adds them to a layout published before (the four other governance widgets
  are added as live buttons of the `END` rail where they are offered).
- **Who governs** takes `style`: `list` (default) or `gallery` (the governance gallery). **The
  channels** are offered to the public universes too, from the governance level "village": a rule
  of the reader's app, which reads the level of the universe (the registry says `public`).
  **The pinned channels** are offered in the public universes too since v2.8.0 (`offeredIn`
  `["private", "public"]`, required in none), under the same rule.
- **The pinned rails**: a rail takes `pinned` (a boolean, read on the phone: its live buttons along
  its edge, without a tab). **The time column** (`pinnedRail: true`) may be a live button in a
  pinned rail of a phone canvas: it is then shown (invariant 3), never in a folded rail
  (`LAYOUT_TIME_COLUMN_REQUIRED`), never expanded there; it is still never stowed by a reader
  retouch nor by the derivation.
- **The head row** takes `button` in a widget rail only (`railOnly: ["button"]`, the
  announcements; `LAYOUT_RAIL_INVALID` on the canvas), opening only (`behaviors: ["OPEN"]`); on the
  canvas its `full` still covers any width and is not counted in the widget budget.
- **The focus `MAP`** for a live button that switches (`focus` in the registry, the schema and
  the library).
- The free blocks and the navigation widget (also `since: 2`): since v2.9.0, see [The pages of a
  universe](#the-pages-of-a-universe). The platform layouts `now` and `now-private` are not composed yet.

#### The pages of a universe

Since v2.9.0 (specs v49.9.0 to v50.1.0: `contracts/layouts.md` § The governance page, § The pages
of a universe, § The free blocks, § The navigation widget; `governance-page.feature`,
`universe-pages.feature`, `widgets.feature`), the design system carries what the backend added
until then, as it served it (the registry stays at `registryVersion` 3):

- **The free blocks** (`since: 2`, `completion: false`): `textBlock`, `imageBlock`, `linkBlock`,
  `channelBlock`, `buttonBlock`, `separatorBlock`, `spaceBlock`, marked `freeBlock` (since v4.0.0), on the
  family `block` (`buttonBlock` also `control`), offered in the public and
  private universes; on a custom page and among the free blocks of the about page only
  (`LAYOUT_WIDGET_NOT_ON_PAGE` elsewhere). Their `id` and `content` are fields of the document
  `break-rocks-layout/3`, checked by the backend (the hook `content` of `checkPageCanvases`).
- **The navigation widget** (`since: 2`, `completion: false`): `role` (`main`, `secondary`) and
  `format` (`tabs`, `rail`, `bottomBar`, `folded`); `params.pages` and `params.railId` are checked
  by `pageInvariants`.
- **The theme surface `block`**: since v4.0.0 the family of every block, held by the page, holding the
  controls (`tokens/themes/socle.json`, the theme schema).
- **The platform layouts of the pages** (`layouts/platform/`, with `page`): `governance`,
  `governance-private`, `agenda`, `members`, `about`, checked and served by `checkPageLayout`.
- **The icons of the custom pages**: `registry/page-icons.json`.

#### The light dashboard (specs v79.0.0)

Since v2.7.0 (specs v79.0.0, D-217: `contracts/layouts.md` § The universe frame, § The platform
layouts, § Widget actions; `dashboard-layout.feature`, `universe-layouts.feature`), still
`registryVersion` 3:

- **The four focus**: a live button switches to `POSTS`, `CLIPS`, `MAP` or `DEBATES` (`focus` in the
  registry, the schema and the library, `LAYOUT_BEHAVIOR_INVALID` otherwise); `withoutOldFocus`
  serves a live button of a layout published before that switches to another one `OPEN`.
- **The contextual widget rail**: a rail takes `contextual` (a boolean, read on the phone with
  `pinned` only: only its live buttons that carry a news badge are drawn, at most 3, the rail not
  drawn without any). The channels, the head row and "to handle" may be contextual (`contextual`
  in the registry); the head row as a contextual live button may then be on the canvas.
- **`hud`**: on the phone, no `START` rail and no time column (invariant 3: the now page in the
  `bottomBar`, a rule of `%root`/`hud` alone), one `END` rail `pinned` and `contextual` with
  `channels`, `headRow` and `toHandle`; on the tablet and the desktop, no rail, the three as live
  buttons `contextual: hidden` above the time column. The debates, the agenda, the open votes, Who
  governs, the projects, the clips and the members are no longer in it.
- **The widget actions `step` and `turn`** of the live line (its sideways scroll, its turning),
  on the live line only (`LAYOUT_GESTURE_INVALID` elsewhere); since v4.2.0 (specs v99.0.0), `turn` is
  withdrawn and the live line ignored, so both are refused on every widget placed.

#### Readings of the contract

The readings of the contract these documents take, to confirm in the specs:

- (Confirmed by specs v48.0.1.) A widget whose variants are `full` (and `hidden`) only covers any
  number of columns; the example `plaza` gives its identity bar 8 columns.
- The derived phone canvas: the contract makes "every other widget" a live button, but the pulse,
  the welcome wall and the layout switcher have no live button in the registry: they are hidden on
  a derived phone canvas.
- The platform layouts: the tablet canvases are the desktop ones on 8 columns as the derivation
  computes them (the main column `round(8 × 8 / 12)` = 5, the side one 3, the feed `medium`);
  "village square" keeps the universe banner and the identity bar across, as the
  other layouts (the live line too until v4.2.0); "agora" puts the time column over the 4 columns of the start side, beside the
  debates, the rules post and the feed; the private canvases have no rules post (not offered in a
  private universe) and stack Who governs, the channels and the sub-universes in the side column;
  the phone canvases list the widgets of the contract, one per row.
- `hud` (light since v2.7.0, specs v79.0.0): the desktop canvas a proposal of the contract ("the
  document of the design system is the reference"): the rules post over 8 columns and the three
  contextual live buttons on its right, then the feed over 8 and the time column over 4; its tablet
  is the derivation of its desktop; the rules post keeps `folded` (a line, until read: a rule of the
  apps).

The schemas are written in the subset of draft 2020-12 that `scripts/json-schema.mjs` validates,
without dependency (a keyword outside it stops the build), so that they mean the same for any
validator: they also compile in Ajv 2020 in strict mode, which gives the same result on every
document below.

<!-- documents:start (generated by scripts/build-tokens.mjs) -->
| Document | Expected | Result |
|---|---|---|
| `examples/themes/faille-v48.json` | valid | valid |
| `examples/themes/faille.json` | valid | valid |
| `examples/themes/personal-accent.json` | valid | valid |
| `examples/themes/vestiaire.json` | valid | valid |
| `examples/themes/invalid/schema.body-typeface.json` | refused by the schema | refused: `/typography/body` body is not allowed |
| `examples/themes/invalid/schema.color-not-rrggbb.json` | refused by the schema | refused: `/variants/night/palette/text` must match ^#[0-9A-Fa-f]{6}$ |
| `examples/themes/invalid/schema.external-image.json` | refused by the schema | refused: `/imageSlots/timeColumn` must match one of anyOf |
| `examples/themes/invalid/schema.format-3.json` | refused by the schema | refused: `/format` must be one of "break-rocks-theme/1", "break-rocks-theme/2" |
| `examples/themes/invalid/schema.image-slot-unknown.json` | refused by the schema | refused: `/imageSlots/sidebar` sidebar is not allowed |
| `examples/themes/invalid/schema.name-starts-with-digit.json` | refused by the schema | refused: `/name` must match ^(?!.*\.\.)\p{L}[\p{L}\p{N}._-]{0,62}[\p{L}\p{N}_-]$ |
| `examples/themes/invalid/schema.scrim-above-1.json` | refused by the schema | refused: `/scrims/page/night` at most 1 |
| `examples/themes/invalid/schema.surface-unknown.json` | refused by the schema | refused: `/variants/night/surfaces/navigation` navigation is not allowed |
| `examples/themes/invalid/schema.v1-with-surface-radius.json` | refused by the schema | refused: `/surfaceRadius` not allowed here |
| `examples/themes/invalid/schema.v1-with-surfaces.json` | refused by the schema | refused: `/variants/night/surfaces` surfaces is not allowed |
| `examples/themes/invalid/schema.v2-banner-in-images.json` | refused by the schema | refused: `/images/banner` banner is not allowed |
| `examples/themes/invalid/schema.variant-missing.json` | refused by the schema | refused: `/variants` day is required |
| `layouts/platform/about.json` | valid (public) | valid |
| `layouts/platform/agenda.json` | valid (public) | valid |
| `layouts/platform/agora.json` | valid (public, root) | valid |
| `layouts/platform/feed-first-private.json` | valid (private) | valid |
| `layouts/platform/feed-first.json` | valid (public, root) | valid |
| `layouts/platform/governance-private.json` | valid (private) | valid |
| `layouts/platform/governance.json` | valid (public) | valid |
| `layouts/platform/hud.json` | valid (public, root) | valid |
| `layouts/platform/members.json` | valid (public) | valid |
| `layouts/platform/studio-private.json` | valid (private) | valid |
| `layouts/platform/studio.json` | valid (public, root) | valid |
| `layouts/platform/village-square.json` | valid (public, root) | valid |
| `examples/layouts/feed-first.json` | valid (public) | valid |
| `examples/layouts/plaza.json` | valid (public) | valid |
| `examples/layouts/published-before-v99.json` | valid (public) | valid |
| `examples/layouts/invalid/LAYOUT_BEHAVIOR_INVALID.json` | `LAYOUT_BEHAVIOR_INVALID` | `LAYOUT_BEHAVIOR_INVALID` |
| `examples/layouts/invalid/LAYOUT_BUDGET_EXCEEDED.json` | `LAYOUT_BUDGET_EXCEEDED` | `LAYOUT_BUDGET_EXCEEDED` |
| `examples/layouts/invalid/LAYOUT_CANVAS_MISSING.json` | `LAYOUT_CANVAS_MISSING` | `LAYOUT_CANVAS_MISSING` |
| `examples/layouts/invalid/LAYOUT_CONTEXTUAL_INVALID.json` | `LAYOUT_CONTEXTUAL_INVALID` | `LAYOUT_CONTEXTUAL_INVALID` |
| `examples/layouts/invalid/LAYOUT_FEED_REQUIRED.json` | `LAYOUT_FEED_REQUIRED` | `LAYOUT_FEED_REQUIRED` |
| `examples/layouts/invalid/LAYOUT_FEED_TOO_NARROW.json` | `LAYOUT_FEED_TOO_NARROW` | `LAYOUT_FEED_TOO_NARROW` |
| `examples/layouts/invalid/LAYOUT_GESTURE_INVALID.json` | `LAYOUT_GESTURE_INVALID` | `LAYOUT_GESTURE_INVALID` |
| `examples/layouts/invalid/LAYOUT_GESTURE_INVALID.turn.json` | `LAYOUT_GESTURE_INVALID` | `LAYOUT_GESTURE_INVALID` |
| `examples/layouts/invalid/LAYOUT_IDENTITY_REQUIRED.json` | `LAYOUT_IDENTITY_REQUIRED` | `LAYOUT_IDENTITY_REQUIRED` |
| `examples/layouts/invalid/LAYOUT_ITEMS_OVERLAP.json` | `LAYOUT_ITEMS_OVERLAP` | `LAYOUT_ITEMS_OVERLAP` |
| `examples/layouts/invalid/LAYOUT_PARAM_INVALID.json` | `LAYOUT_PARAM_INVALID` | `LAYOUT_PARAM_INVALID` |
| `examples/layouts/invalid/LAYOUT_PARAM_INVALID.map-nothing.json` | `LAYOUT_PARAM_INVALID` | `LAYOUT_PARAM_INVALID` |
| `examples/layouts/invalid/LAYOUT_RAIL_INVALID.head-row-on-canvas.json` | `LAYOUT_RAIL_INVALID` | `LAYOUT_RAIL_INVALID` |
| `examples/layouts/invalid/LAYOUT_RAIL_INVALID.json` | `LAYOUT_RAIL_INVALID` | `LAYOUT_RAIL_INVALID` |
| `examples/layouts/invalid/LAYOUT_RULES_POST_REQUIRED.json` | `LAYOUT_RULES_POST_REQUIRED` | `LAYOUT_RULES_POST_REQUIRED` |
| `examples/layouts/invalid/LAYOUT_SPAN_INVALID.json` | `LAYOUT_SPAN_INVALID` | `LAYOUT_SPAN_INVALID`, `LAYOUT_FEED_TOO_NARROW` |
| `examples/layouts/invalid/LAYOUT_TIME_COLUMN_REQUIRED.folded-rail.json` | `LAYOUT_TIME_COLUMN_REQUIRED` | `LAYOUT_TIME_COLUMN_REQUIRED` |
| `examples/layouts/invalid/LAYOUT_TIME_COLUMN_REQUIRED.json` | `LAYOUT_TIME_COLUMN_REQUIRED` | `LAYOUT_TIME_COLUMN_REQUIRED` |
| `examples/layouts/invalid/LAYOUT_TIME_COLUMN_REQUIRED.phone-of-a-copy-of-hud.json` | `LAYOUT_TIME_COLUMN_REQUIRED` | `LAYOUT_TIME_COLUMN_REQUIRED` |
| `examples/layouts/invalid/LAYOUT_VARIANT_NOT_ALLOWED.json` | `LAYOUT_VARIANT_NOT_ALLOWED` | `LAYOUT_VARIANT_NOT_ALLOWED`, `LAYOUT_FEED_TOO_NARROW` |
| `examples/layouts/invalid/LAYOUT_WIDGET_NOT_ON_PAGE.json` | `LAYOUT_WIDGET_NOT_ON_PAGE` | `LAYOUT_WIDGET_NOT_ON_PAGE` |
| `examples/layouts/invalid/schema.address-bar-on-desktop.json` | refused by the schema and checkLayout | refused: `/canvases/desktop/addressBar` addressBar is not allowed; checkLayout: `LAYOUT_FRAME_INVALID` |
| `examples/layouts/invalid/schema.behavior-kind-unknown.json` | refused by the schema and checkLayout | refused: `/canvases/desktop/items/4/behavior` must match one of oneOf; checkLayout: `LAYOUT_BEHAVIOR_INVALID` |
| `examples/layouts/invalid/schema.color-in-layout.json` | refused by the schema and checkLayout | refused: `/canvases/desktop/items/2/background` background is not allowed; checkLayout: `LAYOUT_FORMAT_INVALID` |
| `examples/layouts/invalid/schema.columns-10.json` | refused by the schema and checkLayout | refused: `/canvases/desktop/columns` must be one of 4, 8, 12; checkLayout: `LAYOUT_COLUMNS_INVALID` |
| `examples/layouts/invalid/schema.contextual-always.json` | refused by the schema and checkLayout | refused: `/canvases/desktop/items/4/contextual` must be one of null, "button", "hidden"; checkLayout: `LAYOUT_CONTEXTUAL_INVALID` |
| `examples/layouts/invalid/schema.desktop-missing.json` | refused by the schema and checkLayout | refused: `/canvases` desktop is required; checkLayout: `LAYOUT_DESKTOP_MISSING` |
| `examples/layouts/invalid/schema.placed-item-without-span.json` | refused by the schema and checkLayout | refused: `/canvases/desktop/items/4` cols is required; checkLayout: `LAYOUT_SPAN_INVALID` |
| `examples/layouts/invalid/schema.rail-contextual-not-boolean.json` | refused by the schema and checkLayout | refused: `/canvases/desktop/rails/0/contextual` must be boolean; checkLayout: `LAYOUT_RAIL_INVALID` |
| `examples/layouts/invalid/schema.rail-item-not-a-button.json` | refused by the schema and checkLayout | refused: `/canvases/desktop/items/4/variant` must be "button"; checkLayout: `LAYOUT_RAIL_INVALID` |
| `examples/layouts/invalid/schema.rail-pinned-not-boolean.json` | refused by the schema and checkLayout | refused: `/canvases/desktop/rails/0/pinned` must be boolean; checkLayout: `LAYOUT_RAIL_INVALID` |
| `examples/layouts/invalid/schema.rail-side-top.json` | refused by the schema and checkLayout | refused: `/canvases/desktop/rails/0/side` must be one of "START", "END", "BOTTOM"; checkLayout: `LAYOUT_RAIL_INVALID` |
| `examples/layouts/invalid/schema.surface-glass.json` | refused by the schema and checkLayout | refused: `/canvases/desktop/items/2/surface` must be one of "opaque", "transparent"; checkLayout: `LAYOUT_FORMAT_INVALID` |
| `examples/layouts/invalid/schema.switch-focus-governance.json` | refused by the schema and checkLayout | refused: `/canvases/desktop/items/4/behavior` must match one of oneOf; checkLayout: `LAYOUT_BEHAVIOR_INVALID` |
| `examples/layouts/invalid/schema.switch-focus-unknown.json` | refused by the schema and checkLayout | refused: `/canvases/desktop/items/4/behavior` must match one of oneOf; checkLayout: `LAYOUT_BEHAVIOR_INVALID` |
| `examples/layouts/invalid/schema.widget-unknown.json` | refused by the schema and checkLayout | refused: `/canvases/desktop/items/4/widget` must be one of "feed", "clips", "timeColumn", "liveLine", "whoGoverns", "agenda", "projects", "debates", "channels", "subUniverses", "showcase", "map", "identityBar", "universeBanner", "rulesPost", "headRow", "pulse", "welcomeWall", "layoutSwitcher", "openVotes", "proposals", "myDuties", "rules", "pinnedChannels", "governanceHistory", "members", "toHandle", "textBlock", "imageBlock", "linkBlock", "channelBlock", "buttonBlock", "separatorBlock", "spaceBlock", "navigation"; checkLayout: `LAYOUT_WIDGET_UNKNOWN` |
<!-- documents:end -->

## Licence

MIT (`LICENSE`).
