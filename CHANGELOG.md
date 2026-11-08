# Changelog

Generated from the CHANGELOG of break-rocks-design: per version, the entries that touch what is published here
(`lib/`, `schemas/`, `registry/widgets.json`, `layouts/platform/`, `examples/`, `dist/web/`). Do not edit by hand.

## v4.2.0 — 2026-11-08

**The layout library no longer requires the live line**, for specs v99.0.0 (D-293, contracts/layouts.md
§ Since v99.0.0; specs read up to v101.3.3): the live line is merged into the time strip, which the apps draw
at the head of the content column, never placed by a layout (README § The shared library of the layouts).
Minor: expand then contract (D-203), every document valid before stays valid.

- `lib/layout`: invariant 2 is withdrawn, `LAYOUT_LIVE_LINE_REQUIRED` is no longer raised (`checkLayout`,
  `checkPageCanvases`, `applyRetouches`). A widget marked `ignored` in the registry (`liveLine`) is accepted
  wherever a document places it and ignored: not checked (variant, span, overlap, rail, gestures), not counted
  in the widget budget, left out of the derived tablet and phone canvases (`deriveTablet`, `derivePhone`,
  `derivePagePhone`; the derived phone head is the universe banner, the identity bar, the time column, the
  rules post, the head row and the feed), a reader retouch of it left out. New export `isIgnored`, new field
  `WidgetEntry.ignored`.
- The widget action `turn` is withdrawn: the shape and `schemas/layout-v1.schema.json` still accept it (the
  gestures of a document published before, on the live line, ignored); on any widget placed it is
  `LAYOUT_GESTURE_INVALID`, as `step`, now the action of the time strip the apps draw.
- `registry/widgets.json` (specs v101.3.3, `registryVersion` 3 unchanged): `liveLine` is `ignored: true`,
  without family nor variant, offered and required nowhere; `step` and `turn` name no widget (`turn`
  `withdrawn: "v99.0.0"`). The families and `freeBlock` (the seven free blocks) are unchanged.
- The platform layouts (`layouts/platform/`) and the examples (`examples/layouts/`) no longer place the live
  line, their rows closed up; `examples/layouts/invalid/LAYOUT_LIVE_LINE_REQUIRED.json` removed;
  `LAYOUT_BUDGET_EXCEEDED.json` counts seven widgets without it; new `published-before-v99.json` (a live line
  with `turn` and `step`, valid) and `invalid/LAYOUT_GESTURE_INVALID.turn.json`. Snapshots regenerated.

## v4.1.0 — 2026-11-07

**The page opacity over the universe image, settable by the reader**, for specs v100.0.0 (D-299, decided
2026-11-07; README § The image of a universe, § The page opacity). Minor: new tokens; the former subtle tokens
stay as deprecated aliases.

- `image.page.opacity` (`tokens/themes/socle.json`): `default` **0.64**, `min` 0.40, `max` 1.00, `step` 0.01;
  CSS `--image-page-opacity-default`, `-min`, `-max`, `-step` and `--image-page-opacity` (the value drawn, set by
  the app from "Page opacity" of Me › Display, the default otherwise); `imageShows.page` (TypeScript);
  `BrImageShows.pageOpacityDefault`, `pageOpacityMin`, `pageOpacityMax`, `pageOpacityStep` (Dart, Swift, Kotlin).
  The page over the image with subtle (tablet and desktop) and with through (between the blocks).
- Deprecated, resolving to the default: `--image-subtle-page-opacity` (now 64 %, 94 % before),
  `--image-subtle-opacity` (now 36 %, 6 % before), `image.subtle.*`, `imageShows.subtle`,
  `BrImageShows.subtlePage` and `subtleImage`. A client that kept them draws 64 % until it reads the setting.

## v4.0.0 — 2026-11-06

**Strates families**, for specs v99.0.0 (D-293, decided 2026-11-06: the audit of the universe page; README
§ Theme surfaces, § The image of a universe, § The grid of a universe page, § Monograms). Major: the theme
surfaces become four families, the shapes of a theme and their tokens go, six theme surfaces are removed.

- **BREAKING CHANGE**: the theme surfaces are **four families set by their colors only**, `page`, `sky`, `block`
  and `control` (`--socle-surface-<family>-*`, hooks `--theme-surface-<family>-<bg|text|muted>` only). The former
  theme surfaces `pageHeader`, `widget`, `quoteCard`, `timeColumnCard`, `headRow`, `channelHeader`,
  `channelBubble`, `rail`, `primaryButton`, `secondaryButton`, `badge`, `link` stay as **deprecated aliases**
  resolving to their family (their hooks `--theme-surface-<former>-*` are no longer read; `secondaryButton`,
  `badge` and `link` keep their Strates recipe inside `control`). `pageHeader` now reads the family `sky`, the
  Strates sky (the primary under the on-color; the page before).
- **BREAKING CHANGE**: `postCard`, `repostCard`, `replyCard`, `liveLine`, `focusBar` and `divider` are removed
  (their CSS variables and typed fields): a post has no card, the live line is merged into the time strip, the
  chips of the focus bar are controls, no line between blocks. A theme that still gives them is read without
  error and they are ignored (`lib/theme` `readTheme`, the schema accepts them as deprecated).
- **BREAKING CHANGE**: the shapes of a theme are withdrawn: `shape.card|control|flat.<sharp|soft|round>`
  (`--shape-*`), `shapes`, `ShapeKind`, `ShapeName`, `surfaceRadius()`, `BrShape`, `BrShapeKind`, `BrShapeName`.
  The radii are fixed: a post 0 (`radius.post`, new), a block 20, a control 12, a pill 999; `-radius` of a theme
  surface reads `--radius-*`. The schema keeps `shape` (radius, stroke) and `surfaceRadius` as deprecated, any
  value accepted, ignored (`THEME_RADIUS_INVALID`, `THEME_STROKE_INVALID` no longer raised); `typography.accent`
  is deprecated (merged with the title typeface).
- **BREAKING CHANGE**: the registry (`registry/widgets.json`) lists the families as the theme surfaces of each
  widget (every widget on `block`, the feed on `page` and `block`, the identity bar and the universe banner on
  `sky`, the layout switcher and the navigation on `control`); the free blocks are marked `freeBlock: true`
  (they were the widgets on `block`).
- **Deprecated**: `surface.veil` (`--surface-veil`, `--surface-veil-opacity`, `veil`, `BrVeil`), an alias of the
  readability mask at its ceiling (the same values).
- **Added.**
  - The **readability mask** `surface.mask`: `--surface-mask` (the color of the page), `--surface-mask-opacity`
    per mode (the ceiling, the worst case over any image: 83 / 85 / 89 %, drawn while no `scrims.mask` is
    served), `--surface-mask-floor` (60 %); `mask`, `BrMask`. The AA rule of the scrim the backend computes:
    README § The readability mask, `maskOpacity` of `lib/theme`.
  - **How the image shows** (`image`): subtle, the image at 6 % and the page at 94 % (`--image-subtle-opacity`,
    `--image-subtle-page-opacity`); through, the **block opacity** night 82 %, dim 84 %, day 86 %
    (`--image-through-block-opacity`), checked so that the text keeps 4.5:1 and the secondary text 3.75:1 on a
    block over any pixel before the mask; `imageShows`, `BrImageShows`. Higher contrast or reduced
    transparency: everything opaque (a rule of the apps).
  - **The grid**: `layout.contentColumn` 720, `layout.contextColumn` 320, `layout.gutter` 32,
    `layout.edge.desktop` 32, `layout.edge.tablet` 32, `layout.edge.phone` 20 (`--layout-*`, `BrLayout`);
    `space.post` and `space.block` 24 (`BrSpace.post`, `BrSpace.block`); `size.rulesLine` 44; the recipes of the
    rules line, the time strip, the composer and the post (README § The grid of a universe page).
  - **Monograms of the authors**: `monogram` (6 steps, the saturation, the luminance of each step and the ink per
    mode), `monogramColor(universeHue, accountId, mode)`, `hueOfColor`, `fnv1a` (`tokens.ts`),
    `BrMonogram.color`, `hueOfRgb`, `fnv1a` (Dart, Swift, Kotlin): one lightness step per account within the
    hue of the accent of the universe, the ink at least 5:1 on every hue, two steps at least 1.16:1 apart; test
    vectors checked by the build.
  - `families`, `formerSurfaces`, `removedSurfaces`, `hookParts` (`tokens.ts`), `BrSurfaceFamily` (Dart, Swift,
    Kotlin).
  - `lib/theme/index.ts`: `readTheme`, `themeHooks`, `maskOpacity` (tests: `node --test lib/theme/theme.test.ts`).
  - The schema: the families `sky` and `control`, `scrims.mask`, the keyword `deprecated` (annotation only) in the
    subset of `scripts/json-schema.mjs`.
  - Examples: `examples/themes/faille.json` on the families; `faille-v48.json`, the same as written before, valid
    and read into the families; `invalid/schema.radius-in-pixels.json` removed (a radius is no longer refused).
- Not yet: `lib/layout`, the platform layouts and the examples still place and check the live line (invariant 2,
  `LAYOUT_LIVE_LINE_REQUIRED`, the action `turn`), withdrawn by specs v99.0.0.

## v3.2.0 — 2026-11-05

**Every text pair reaches WCAG AA (4.5:1), day and night, with a margin (at least 4.60).** Minor: some
values change, no name goes; text variants are added. The sign colors and the sky keep their validated
Strates values as fills, icons, markers, dots, chips, badges and pastilles (with their inks); text in
those colors reads a new **text variant**, on the pattern of `rose-text` (README § The signs, Fill or
text). **Apps: switch every text usage of a sign color or of the sky to its text variant.**

- **Added** (palette, CSS `--socle-<color>-text`, typed `<color>Text`; equal to the base color at night
  and dim, darker in day; worst pair of the base color as text before → the variant after).
  - `sky-text` `#1B61BA` (sky `#1F6FD6`): on my message bubble 3.71 → 4.61, on the hovered surface
    4.11 → 5.10.
  - `blue-text` `#14418F` (blue `#1D5FD0`): on my message bubble 4.43 → 7.31; kept darker than
    `sky-text` so that a universe name does not read as a link (1.59:1 between them, 1.20 between the
    base colors).
  - `leaf-text` `#10704C` (leaf `#148A5E`): hovered surface 3.66 → 5.14, page 4.07 → 5.71, surface
    4.35 → 6.10, my message bubble 3.31 → 4.63.
  - `amber-text` `#875900` (amber `#B97A00`): hovered surface 3.03 → 5.11, page 3.36 → 5.68, surface
    3.59 → 6.07, my message bubble 2.73 → 4.61.
  - `violet-text` `#6E34F4` (violet `#8B5CF6`): hovered surface 3.57 → 5.11, page 3.96 → 5.68, my
    message bubble 3.22 → 4.61.
  - Roles `sign.<kind>Text` (CSS `--sign-<kind>-text`, typed `sign<Kind>Text`), the sign as text:
    `mentionText` (text), `universeText` (blue-text), `commandText` and `playlistText` (amber-text),
    `tagText` (leaf-text), `discussionText` (violet-text), `liveText` (rose-text).

## v3.1.0 — 2026-11-04

**Pupitre**, the art direction of the back office (README § Pupitre (back office)). Minor: additions
only; the palette, the roles, the signs and the theme surfaces the apps read keep their names and values.

- **Added.**
  - `tokens/backoffice/pupitre.json` (night and day; dim reads night, resolved on its own palette):
    - **Environment skies** `--env-<prod | staging | dev | mock>-bg`, `-text`, `-muted`, `-control-bg`,
      `-dot`. Night: prod `#14213A` / `#EAF1FF` / `#B9CBEA` / `#22365A` / `#8CC6FF`, staging `#3A2A0C` /
      `#FFE2A3` / `#E2C98A` / `#54401A` / `#F2B33D`, dev `#10311F` / `#BDF2D6` / `#9ED9BA` / `#1B4A31` /
      `#3FC98A` (the control fills of staging and dev derived). Day: pale tints of the same hues, their
      night background as the ink (prod `#DCE8FB`, staging `#FBEBC8`, dev `#D5F2E2`). `mock` is the dev sky.
    - **Decision stamps** `--stamp-<allowed | removed | escalated | pending>-bg`, `-ink`: leaf, the danger
      red, violet, amber, on their tint (the color at 12 % into the surface); in day the ink is the color
      at 70 % into the text.
    - **Due gauge** `--gauge-ok` (leaf), `--gauge-soon` (amber), `--gauge-late` (danger), `--gauge-track`
      (tone-2), read from the palette and the roles.
  - Sizes `size.rail` 72, `size.trayRow` 44, `size.stamp` 56, `size.stampRadius` 14 (`--size-*`, `BrSize`).
  - Typed: `pupitre`, `Environment`, `StampKind` (`tokens.ts`); `BrPupitre`, `BrEnvSky`, `BrStamp`,
    `BrGauge` (Dart, Swift, Kotlin).

## v3.0.0 — 2026-11-04

**Strates**, the art direction of Socle validated on 2026-11-04 (README § Strates). It adds to Socle and
replaces none of it. Major: the sign `&` changes color, the badge rule changes, the radii of the shapes
change, two deprecated sign tokens and the meaning of `--socle-rose` go.

- **Breaking.**
  - `&` is **violet** (`#C4B5FD` at night and dim, `#8B5CF6` in day; rose before), its ink black (white
    reads 4.23:1 on the violet of day).
  - **Address badges take the color of their sign**, never a hue from their name; a universe badge is
    the universe blue, a universe's own color comes from its theme palette. `hueOf`, `badgeColors`,
    `badges`, `BrBadge` and `--badge-*` are deprecated, kept only as the fallback of a monogram without a
    theme.
  - Danger has its own red, distinct from the live rose: palette `red` and `on-red` (`#FF6161` / dark ink
    at night and dim, `#C62828` / white in day); `--socle-rose` and `on-rose` are replaced: `rose` is now
    the live rose `#E8396F`, `on-rose` is gone. `--color-live` reads `rose-text` (`#FF6B95`, `#C21E56`),
    the live rose raised to 4.5:1 for the label.
  - `--color-universe` and `sign.universe` read the new palette entry `blue` (`#9EC5FF` at night and dim,
    `#1D5FD0` in day; sky before). `sky` stays for links and the focus.
  - `sign.account` and `sign.channel` (deprecated since v2.10.0) are removed.
  - Shapes: `soft` is 20 px for the cards (14 before) and 12 px for the controls (10 before); a pill is
    999 (9999 before). `radius.control` 12, `radius.block` 20, `radius.pill` 999 are added;
    `radius.sm`, `md`, `lg`, `full` (6, 10, 14, 9999) are deprecated aliases with their values.
  - Tones, not outlines: the cards and widgets of Socle (`widget`, `postCard` and its followers,
    `timeColumnCard`, `liveLine`, `channelBubble`, `block`) and the role `badge` lose their stroke (their
    border is their background); `secondaryButton` becomes a tone-2 pill (`surfaceHover`) without an
    outline (its `outline` check goes: its label identifies it). Day `surface-2` is sand-dark `#F0EBE2`
    (`#F1ECE4` before).
- **Added.**
  - Signs `!` (`sign.playlist`, amber, dark ink) and `~` (`sign.live`, the live rose `#E8396F` in every
    mode, dark ink 4.75:1); a tint per sign (`sign.<kind>Tint`, the sign at 12 % into the surface), the
    background of a soft badge under the text color.
  - Palette entries `blue`, `violet`, `rose` (the live rose), `rose-text`, `red`, `on-red`: fixed, a
    universe theme never sets them.
  - Theme surfaces of Strates, with their CSS variables and hooks (`format2: false`: not in the contract
    nor the theme schema yet): `sky`, `skyControl`, `skyCollapsed`, `focusRail`, `focusRailSelected`,
    `timeStripEvent`, `timeStripVote`, `timeStripDebate`, `timeStripProject`, `monogram`, `skeleton`.
    `check-documents` compares the schema with the theme surfaces of the format 2 only.
  - Text roles `font.role.*` (`$type` typography; CSS `--font-role-<role>-family`, `-weight`, `-size`,
    `-line-height`, `-letter-spacing`; `typeRoles`; `BrTextRole`, `BrType`): `display` (Sora 800,
    34/36, -0.02 em), `sectionTitle` (Sora 700, 22/28), `body` (Figtree 400, 17/26), `author` (Figtree
    600, 15/20), `meta` (Figtree 400, 13/18), `address` (JetBrains Mono 500, 15/20). One bold per line.
    Sora 800 was already hosted (the variable files reach 800): no new font file.
  - Motion: `motion.duration.land` 320, `rail` 200, `chipPress` 120, `reduced` 120 ms; `motion.easing.*`
    (ease-out; `reduced` linear); `motion.scale.chipPress` 1.04 (`motion`, `BrMotion`). With reduced
    motion, fades of 120 ms only.
  - Sizes: `size.monogram.md` 40 (radius 12), `lg` 44 (radius 13), `size.skyCollapsed` 4 (`BrSize`).
  - The action rule (one ember primary per screen, a tone-2 pill for the secondary, text for the
    tertiary), the outline rule and the monogram rule in the README.

## v2.10.0 — 2026-11-01

The signs have a color each, and the pages that show an image have a veil (specs v81.0.0 and v81.1.0:
`composer.feature`, D-224, "a token of the design system shared with the address bar"; `universe-frame-modes.feature`,
`universe-discussions.feature`, D-218 revised: "a veil keeps a contrast of 4.5:1"). Everything is added; the
palette and the roles that exist keep their values.

- **Sign tokens** (`tokens/themes/socle.json`, group `sign`; CSS `--sign-<kind>`, `--sign-on-<kind>`; typed
  `sign<Kind>`, `signOn<Kind>` in TypeScript, Dart, Swift and Kotlin): one fixed color per reserved sign, the
  fill of its pastille, with its ink, the text on the pastille. `sign.mention` `@` (the text color),
  `sign.universe` `%` (sky), `sign.command` `/` (the amber of Socle, new), `sign.tag` `#` (leaf),
  `sign.discussion` `&` (rose): the existing values, for `@`, `%`, `#` and `&`. Inks: `onMention` and
  `onUniverse` the ink on ember (dark at night and dim, white in day), `onCommand` the dark ink, `onTag` black,
  `onDiscussion` the ink on rose.
- `sign.account` and `sign.channel` (`--sign-account`, `--sign-channel`, `signAccount`, `signChannel`) are the
  former names of `mention` and `discussion`, with the same values: **deprecated**, kept until the next major
  version.
- **`surface.veil`** (`--surface-veil`, `--surface-veil-opacity` per mode, `veil` in `dist/web/tokens.ts`,
  `BrVeil` in Dart, Swift and Kotlin): the color of the page at an opacity computed for the worst case, so that
  the text and the secondary text keep 4.5:1 over any image. The worst case is a black or a white pixel (the
  luminance of the composite grows with each channel of the pixel); the opacity is the lowest multiple of 1 %
  that holds over both and from there to 100 % (`veilOpacity`, `overVeil` in `scripts/color.mjs`). Kept:
  night 83 %, dim 87 %, day 93 % (the secondary text sets it; the text alone: 60 %, 63 %, 53 %). Checked over
  4096 pixels (4.52 / 4.57 / 4.61 for the secondary text) and one step lower, where it falls short
  (4.34 / 4.42 / 4.48). It is not a theme surface: `SURFACES` skips it, the theme schema is unchanged. README,
  § The veil of a page, documents the calculation.

## v2.9.0 — 2026-10-31

The registry carries the pages of a universe (specs v49.9.0 to v50.1.0: `contracts/layouts.md`
§ The governance page, § The pages of a universe, § The free blocks, § The navigation widget;
`governance-page.feature`, `universe-pages.feature`, `widgets.feature`): what the backend added
around the design system, and the web app copied from it, is carried here, as the backend serves
it (no change of behavior). The registry stays at `registryVersion` 3. Everything is added.

- `registry/widgets.json`: the free blocks `textBlock`, `imageBlock`, `linkBlock`, `channelBlock`,
  `buttonBlock`, `separatorBlock`, `spaceBlock` (surface `block`; `buttonBlock` also
  `primaryButton`, `separatorBlock` also `divider`) and the widget `navigation` (`focusBar`, `rail`;
  `full`, `wide`, `medium`, `button`; `role` and `format`), all `since: 2`, offered in the public and
  private universes, and `completion: false` (the backend gave them `since: 1` in the registry it
  completes with: the same, a layout published before is never completed with them).
- `layouts/platform/`: `governance`, `governance-private`, `agenda`, `members`, `about`, with
  `page`, as in the backend.
- The theme surface `block` (`tokens/themes/socle.json`, `schemas/theme-v2.schema.json`): the widget
  surface unless set, held by the page; the buttons, links, badges and dividers held by it too.
  `dist/` and the README tables written again.
- `schemas/layout-v1.schema.json`: the eight widgets, and `page` (`home` by default, `governance`,
  `agenda`, `members`, `about`).
- `lib/layout/index.ts`: the pages of a universe, from the backend: `checkPageCanvases`,
  `pageInvariants` (G2 to G4, P2 to P6, the navigation widget, `CANVAS_ITEMS_LIMIT`; the content of
  a free block and the names of the pages through the hooks `content`, `pages`, `pageKey`),
  `derivePage`, `derivePagePhone`, `pageRegistry`, `blocksRegistry`, `withoutPageFields`,
  `hasHeading2`, `checkPageLayout` (a platform layout with a `page`), `FREE_BLOCKS`, `isFreeBlock`,
  `GOVERNANCE_WIDGETS`, `LAYOUT_PAGES`, `DEFAULT_PAGE_LIMITS`.
- `lib/layout/layout.test.ts`: the five layouts of the pages (snapshots `page.<name>.json`), the
  free blocks and the navigation widget in the registry and never completed, a free block refused
  outside a custom page, G2, one main menu, `bottomBar` on a phone only, `LAYOUT_PAGE_INVALID`.
- Checked against the backend (its code at `cd8210f`, design v2.8.0): the eight widget entries
  (but `completion` and `note`), the icons, the theme surfaces, the five layouts as stored and as
  served, and the seven other platform layouts as served, equal. The backend can drop its
  TEMPORARY `WIDGETS_V2`, `withPageWidgets`, `completionRegistry`, `PAGE_ICONS`, the page checks
  and derivation of `themes/layouts/pages.ts`, `./platform/*.json` and the `block` of
  `surfaces.ts`; the web app its `PAGE_WIDGETS` and `PAGE_ICONS`.

## v2.8.0 — 2026-10-31

The pinned channels offered to the public universes (specs v73+, `features/channels/`: the pinned
channels of a public universe, `&general` pinned first). The registry stays at `registryVersion` 3.

- `registry/widgets.json`: `pinnedChannels` is `offeredIn: ["private", "public"]` (was `private`);
  `requiredIn` unchanged (empty; the governance page of a private universe requires it elsewhere).
  A layout of a public universe published before `registryVersion` 2 now gains it in its `END` rail
  through `applyRegistry`.
- `lib/layout/layout.test.ts`: the registry test of `pinnedChannels`; the completion test of a public
  layout expects it.

## v2.7.0 — 2026-10-31

The light dashboard (specs v79.0.0, D-217: `contracts/layouts.md` § The universe frame, § The
platform layouts, § The layout document, § Widget actions, § Invariants; `dashboard-layout.feature`,
`universe-layouts.feature`). The registry stays at `registryVersion` 3.

- `layouts/platform/hud.json`: the light `hud`. Phone: identity bar, live line, rules post, feed;
  no `START` rail, no time column (the now page in the `bottomBar`); one `END` rail `pinned` and
  `contextual` with `channels`, `headRow` and `toHandle`. Tablet and desktop: no rail; the three as
  live buttons `contextual: hidden` above the time column, beside the rules post. The debates, the
  agenda, the open votes, Who governs, the projects, the clips and the members leave it.
- `lib/layout/index.ts`: `FOCUS` is `POSTS`, `CLIPS`, `MAP`, `DEBATES` (a live button that switches
  to `GOVERNANCE`, `AGENDA`, `SHOWCASE` or `SUB_UNIVERSES`: `LAYOUT_BEHAVIOR_INVALID`), `OLD_FOCUS`
  and `withoutOldFocus` (new: such a live button of a layout published before served `OPEN`); a
  rail takes `contextual` (a boolean, `LAYOUT_RAIL_INVALID` otherwise); a variant in a rail only on
  the canvas as a contextual live button (the head row); invariant 3 leaves the phone canvas of
  `%root`/`hud` without a time column (`CheckContext.layout`, set by `checkLayout` and
  `applyRetouches`); the widget actions `step` and `turn`, on the live line only; the derived phone
  moves a contextual live button of the canvas to its `END` rail.
- `registry/widgets.json`: `focus` the four focus; the actions `step` and `turn` (`widgets:
  ["liveLine"]`); `fullScreen` without the live button of the time column in `hud` on a phone;
  `channels`, `headRow` and `toHandle` contextual (their news badge); `specs` v79.0.0.
- `schemas/layout-v1.schema.json`: `contextual` on a rail, the actions `step` and `turn`, the four
  focus.

## v2.6.0 — 2026-10-29

The dashboard: the platform layout `hud` and the widget registry version 3 (specs v69.0.0 to
v71.0.0, D-188 to D-190: `contracts/layouts.md` § The dashboard, § The widget registry, § Invariants;
`dashboard-layout.feature`, `widgets.feature`, `universe-layouts.feature`). Everything is added: a
layout valid before stays valid.

- `layouts/platform/hud.json`: the platform layout `hud` (shown "dashboard"), its three canvases
  given (`derive: false`), as the backend prepared it: the identity bar, the live line, the rules
  post and the feed (`transparent`), the time column beside the feed on the desktop and the tablet;
  a `START` rail (the channels, the debates, the head row, the agenda; the time column on the phone)
  and an `END` rail (the open votes, Who governs, the projects, the clips switching to the focus
  clips, the members, "to handle"), unfolded on the desktop and the tablet, `pinned` on the phone.
- `registry/widgets.json`: `registryVersion` 3. The widgets of the governance page (`since: 2`:
  `openVotes`, `proposals`, `myDuties`, `rules`, `pinnedChannels`, `governanceHistory`) and of the
  dashboard (`since: 3`: `members`, `toHandle`, live buttons only); `completion: false` on the open
  votes, the members and "to handle" (never added to a layout published before);
  `onUniversePage: "button"` on the open votes; Who governs takes `style` (`list`, `gallery`); the
  channels are offered to the public universes (from the level "village", a rule of the apps); the
  head row takes `button` in a rail only (`railOnly`, `behaviors: ["OPEN"]`); the time column may be
  a live button in a pinned rail of a phone (`pinnedRail`); `focus` lists the focus, `MAP` added.
  The free blocks and the navigation widget of version 2 are not carried yet (the pages of a
  universe and the theme surface `block`): the backend keeps adding them.
- `lib/layout/index.ts`: a rail takes `pinned` (a boolean); the time column as a live button in a
  pinned rail of a phone canvas is shown (invariant 3), in a folded one
  `LAYOUT_TIME_COLUMN_REQUIRED`; a variant in a rail only on the canvas `LAYOUT_RAIL_INVALID`; a
  behavior the widget does not take `LAYOUT_BEHAVIOR_INVALID`; `checkUniversePage` (new, run by
  `checkLayout` and `applyRetouches`): the open votes beyond a live button `LAYOUT_WIDGET_NOT_ON_PAGE`;
  `applyRegistry` skips `completion: false`; the reader retouches keep a variant in a rail only off
  the canvas; `fullOnly` leaves the variants in a rail only aside (the head row stays full over any
  width); the focus `MAP`.
- `schemas/layout-v1.schema.json`: the widgets of the registry, `pinned` on a rail, the focus `MAP`.
  `scripts/check-documents.mjs` checks the new keys of the registry and the focus against the schema.
- Examples: `LAYOUT_WIDGET_NOT_ON_PAGE.json`, `LAYOUT_TIME_COLUMN_REQUIRED.folded-rail.json`,
  `LAYOUT_RAIL_INVALID.head-row-on-canvas.json`, `schema.rail-pinned-not-boolean.json`. The frozen
  snapshots of `lib/layout/snapshots/` are written again (`registryVersion` 3; `platform.hud.json`
  and `derived.hud.json` added).

## v2.5.0 — 2026-10-27

The feed of the platform layouts drawn transparent (specs v54.0.0, `contracts/layouts.md` § The
platform layouts; D-146).

- `layouts/platform/*.json`: the `feed` item of the six platform layouts carries
  `"surface": "transparent"` on its three canvases (the posts on the image of the page, without the
  frame of the feed); the other widgets stay `opaque`. The backend drops its `withTransparentFeed`
  patch. No schema, registry nor library change; the frozen snapshots of `lib/layout/snapshots/`
  are refreshed (the derived canvases keep the surface).

## v2.4.0 — 2026-10-24

The parameters of the map widget (specs v49.4.0 to v49.12.0, `contracts/layouts.md` § The widget
registry; `widgets.feature`).

- `registry/widgets.json`: the map widget takes `territory`, `events`, `subUniverses` and
  `locatableResidents`, each `true` (default) or `false`: what it shows. `registryVersion` stays 1
  (no widget joins).
- `lib/layout/index.ts`: a map widget whose four parameters are `false` is refused,
  `LAYOUT_PARAM_INVALID` at the path of its parameters (the widget would show nothing); the backend
  drops the rule it carried for design v2.3.0. Example `examples/layouts/invalid/LAYOUT_PARAM_INVALID.map-nothing.json`.

## v2.3.0 — 2026-10-22

The shared library of the layouts (specs v48.0.1, `contracts/layouts.md` § Layout derivation: "one
algorithm, one shared library"), and the named stroke of a theme.

- `lib/layout/index.ts`: `checkLayout(document, { kind, registry })` (the shape as codes, the
  registry, the invariants and the widget budget, on the canvases given and on the derived ones; the
  document as served when there is no refusal), `deriveLayout` (the tablet and phone canvases
  derived from the desktop one, `derived` on each canvas, `registryVersion`), `deriveTablet`,
  `derivePhone`, `applyRegistry` (a widget that joins the registry added as a live button of the
  `END` rail), `applyRetouches` (the reader retouches, checked again), `publishedOf`,
  `kindOfLayout`. TypeScript without dependency, one file without import that Node runs as it is:
  the backend imports it from its submodule (`design/lib/layout/index.ts`), the web app likewise.
  Tests: `node --test lib/layout/layout.test.ts`, the served documents of the platform layouts and
  of the examples frozen in `lib/layout/snapshots/`.
- `scripts/check-documents.mjs` checks the layouts with the library (one implementation in place
  of its own `checkLayout`); the refused examples of `schema.<case>.json` are refused by the
  library too. A required widget hidden or in a rail is refused by its invariant only.
- `schemas/theme-v2.schema.json`: `shape.stroke` is `thin`, `regular` or `bold`
  (`THEME_STROKE_INVALID`, specs v48.0.1), a number of the format 1 read as the closest name;
  `examples/themes/faille.json` takes `thin`.
- `registry/widgets.json`: a widget may carry `since`, the `registryVersion` it joined in (1 when
  absent).

## v2.2.0 — 2026-10-22

The theme surfaces of the theme format 2 and the documents of the layouts (specs v48.0.0, D-78:
`contracts/themes.md` § Format 2, `contracts/layouts.md`, `theme-surfaces.feature`; the step the
specs call "Socle v3"). Everything is added: no token is renamed nor removed, and a client that
does not draw the format 2 yet has nothing to change.

- The shapes of a theme (`shape` in `tokens/base/layout.json`, `--shape-<kind>-<shape>`): `sharp`,
  `soft` and `round` for the kinds card (0, 14 px, 24 px), control (0, 10 px, a pill) and flat
  (no corners); Socle draws its cards soft and its controls round.
- CSS: `--socle-surface-<name>-bg`, `-text`, `-muted`, `-border` and `-radius` on
  `:root, .universe-themed`, each behind the hook a theme of the format 2 sets,
  `--theme-surface-<name>-<part>`. TypeScript: `surfaces` (per mode), `surfaceKeys`, `shapes`,
  `surfaceRules`, `surfaceRadius`, `surfaceVar`, `surfaceHook`. Dart, Swift and Kotlin:
  `BrSurface`, `BrSurfaces` (`night`, `dim`, `day`, `of`), `BrShapeKind`, `BrShapeName`, `BrShape`.
- `schemas/theme-v2.schema.json` (`break-rocks-theme/2`, which accepts a theme of the format 1
  unchanged) and `schemas/layout-v1.schema.json` (`break-rocks-layout/1`), JSON Schema 2020-12;
  `scripts/json-schema.mjs` validates them without dependency and refuses a keyword outside the
  subset they use.
- `registry/widgets.json`: the widget registry of v48.0.0 (`registryVersion` 1), with the
  breakpoints, the spans, the widget budget, the widget actions and, per widget, its theme surfaces,
  variants, parameters, live content and the universes it is offered and required in.
- `layouts/platform/`: the platform layouts as documents of `%root` (`feed-first`,
  `village-square`, `studio`, `agora`, `feed-first-private`, `studio-private`), their three
  canvases each.
- `examples/`: a theme of the format 2, one of the format 1 and a personal theme; feed first as a
  layout of a universe (its desktop canvas only, derived elsewhere) and the `plaza` example of the
  contract; 13 refused themes and 28 refused layouts. `scripts/check-documents.mjs`, run by the
  build, checks the schemas against the tokens and the registry, every example, and the layouts
  with `checkLayout` (the codes of the contract that need the registry: variants, spans, overlaps,
  rails, behaviors, contextual widgets, gestures, parameters, invariants, budget).

## v2.1.0 — 2026-10-21



- `dist/web/tokens.ts`: `fonts`, per family token (`display`, `sans`, `mono`), the family, its
  weight range, its license and its files per subset (the path relative to `assets/fonts/`, the
  `unicode-range`), for the builds that copy, link or preload them.

## v2.0.0 — 2026-10-21



- **Breaking**: the display modes are `night` (the default, whatever the device), `dim` and `day`
  (were `dark`, `dim`, `light`). The CSS selects them as the web app does, with `data-theme` on
  `<html>`: `:root` (night), `:root[data-theme="dim"]`, `:root[data-theme="day"]`, and
  `:root[data-theme="automatic"]` under `prefers-color-scheme: light` (was `[data-mode]`).
- **Breaking**: the CSS variables of the apps. The palette `--socle-*`: `background`, `surface`,
  `surface-2`, `line-soft`, `line`, `line-strong`, `line-control`, `text`, `muted`, `ember`,
  `on-ember`, `ember-hover`, `kicker`, `sky`, `leaf`, `amber`, `rose`, `on-rose`, `ink`. The roles
  on `:root, .universe-themed`: `--color-*` (new: `separator`, `border-strong`, `control-border`,
  `primary`, `on-primary`, `primary-hover`, `kicker`, `link`, `focus`, `progress`, `live`,
  `on-danger`; the roles of v1 keep their names, with the values of Socle), `--qr-paper`,
  `--qr-ink` and `--sign-universe`, `--sign-account`, `--sign-tag`, `--sign-channel`. Socle
  values: ember `#FF5A3C` (day `#D23A17`, white on it 4.82:1), hover `#FF7358` (day `#B8341A`),
  sky, leaf, amber and rose for links and universes, success, warnings, live and danger; the
  outline of controls `#6D757F` (day `#908979`); the liked heart in ember, never in the rose of
  danger.
- **Breaking**: the typed files follow: TypeScript `palette` and `colors` keyed by
  `night | dim | day`, and `modes`; Dart, Swift and Kotlin `BrSocle` (the palette) beside
  `BrColors` (the roles), `BrMode.night | dim | day`, `BrFont.display`, `sans` and `mono` with
  their fallbacks.
- The three layers in the tokens: a universe theme sets `--socle-*` on its surfaces and the roles
  follow; a palette entry it leaves unset falls back (the separator to the line, the strong line
  and the outline of controls to the muted text mixed into the line, the hover to ember mixed with
  the text, the kicker to ember). The personal theme goes before ember with `--personal-accent`,
  `--personal-on-accent` and the new `--personal-accent-hover`.
- For the apps, which pin this repository by tag (`frontends/react`, `frontends/flutter`,
  `backoffice-react`, `frontends/static`): the web app can load `dist/web/tokens.css` in place of
  its own block of Socle, once it sets `--personal-accent-hover` with its personal accent; the back
  office takes the logo from `breakrocks-logo.svg`; Flutter may take its colors from
  `dist/dart/tokens.dart` again (`BrSocle` for its palette, `BrColors` for the roles).

## v1.0.0 — 2026-10-08



- **Breaking**: theme `night` replaces `clean` as the platform default, and `clean` is removed
  (it lacked the new roles and failed several contrast checks). Night background, paper text, the
  gold of the logo's fist as the one accent, a violet glow for universes, red for danger only.
  Modes: dark ("night", the default, also when no mode is set, whatever the system preference),
  dim and light; the CSS `:root` now carries the dark mode.
- Address badges: per-mode saturation and lightness (`badge` in the theme, solid and soft),
  lower saturation than before, every hue ≥ 4.5:1 without a contrast loop; the hue rule (FNV-1a 32
  of the lowercased canonical name, modulo 360) documented with test vectors; `hueOf` and
  `badgeColors` in TypeScript, `BrBadge` in Dart, Swift and Kotlin; CSS variables
  `--badge-<style>-<part>-<saturation|lightness>` to use with `--badge-hue`.

## v0.3.0 — 2026-10-04



- Generated token files: `dist/web/tokens.css` and `dist/web/tokens.ts` for the web,
  `dist/dart/tokens.dart` for Flutter, by `scripts/build-tokens.mjs` (no dependency).
