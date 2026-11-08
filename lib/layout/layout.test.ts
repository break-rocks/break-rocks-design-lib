// Tests of the shared library of the layouts (lib/layout/index.ts). The derived documents of the
// platform layouts and of the examples are frozen in lib/layout/snapshots/ (written when missing, or
// again with UPDATE_SNAPSHOTS=1, then read in review).
// Usage: node --test lib/layout/layout.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import {
  applyRegistry, applyRetouches, checkLayout, checkPageCanvases, checkPageLayout, deriveLayout, derivePhone, deriveTablet, FREE_BLOCKS, kindOfLayout, OLD_FOCUS, publishedOf, readingOrder, withoutOldFocus,
  type LayoutDocument, type LayoutItem, type PageItem, type WidgetRegistry,
} from './index.ts';

const ROOT = new URL('../../', import.meta.url);
const json = <T>(path: string): T => JSON.parse(readFileSync(new URL(path, ROOT), 'utf8')) as T;
const registry = json<WidgetRegistry>('registry/widgets.json');
const files = (dir: string) => readdirSync(new URL(dir, ROOT)).filter((f) => f.endsWith('.json')).sort();
type PagedDocument = LayoutDocument & { page?: string };
const allPlatform = files('layouts/platform/').map((f) => json<PagedDocument>(`layouts/platform/${f}`));
/** The platform layouts of the page of a universe, and those of the other pages (governance, agenda, members, about). */
const platform = allPlatform.filter((d) => d.page === undefined || d.page === 'home');
const pagePlatform = allPlatform.filter((d) => d.page !== undefined && d.page !== 'home');
const examples = files('examples/layouts/').map((f) => json<LayoutDocument>(`examples/layouts/${f}`));

function snapshot(name: string, value: unknown) {
  const file = new URL(`./snapshots/${name}.json`, import.meta.url);
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (process.env.UPDATE_SNAPSHOTS || !existsSync(file)) { writeFileSync(file, text); return; }
  assert.deepEqual(JSON.parse(text), JSON.parse(readFileSync(file, 'utf8')), `snapshot ${name}`);
}
const kindsOf = (doc: LayoutDocument) => (kindOfLayout(doc.universe, doc.name) === 'private' ? ['private'] as const : ['public', 'root'] as const);
const brief = (items: LayoutItem[]) => readingOrder(items.filter((i) => i.rail === undefined && i.variant !== 'hidden')).map((i) => `${i.widget}:${i.variant}@${i.row},${i.col}+${i.cols}${(i.rows ?? 1) > 1 ? `x${i.rows}` : ''}`);
const desktopOnly = (doc: LayoutDocument): LayoutDocument => ({ ...doc, derive: true, canvases: { desktop: doc.canvases.desktop, tablet: null, phone: null } });

test('the kind of universe a layout is checked for', () => {
  assert.equal(kindOfLayout('%root', 'feed-first'), 'public');
  assert.equal(kindOfLayout('%root', 'feed-first-private'), 'private');
  assert.equal(kindOfLayout('%team-fra.', 'brume'), 'private');
  assert.equal(kindOfLayout('%paris/velo', 'plaza'), 'public');
});

for (const doc of platform) {
  test(`the platform layout ${doc.name} passes checkLayout and is served as given`, () => {
    for (const kind of kindsOf(doc)) assert.deepEqual(checkLayout(doc, { kind, registry }).refusals, [], kind);
    const served = deriveLayout(doc, registry);
    assert.equal(served.registryVersion, registry.registryVersion);
    for (const name of ['desktop', 'tablet', 'phone'] as const) assert.equal(served.canvases[name]?.derived, false);
    snapshot(`platform.${doc.name}`, served);
    assert.deepEqual(publishedOf(served), { ...doc, canvases: doc.canvases });
  });
  test(`the tablet of ${doc.name} derived from its desktop is the one composed by the platform team`, () => {
    const derived = deriveTablet(doc.canvases.desktop, registry, kindOfLayout(doc.universe, doc.name));
    assert.deepEqual(brief(derived.items), brief(doc.canvases.tablet!.items));
  });
  test(`${doc.name} derived from its desktop canvas only passes checkLayout`, () => {
    const only = desktopOnly(doc);
    for (const kind of kindsOf(doc)) assert.deepEqual(checkLayout(only, { kind, registry }).refusals, [], kind);
    const served = deriveLayout(only, registry);
    assert.equal(served.canvases.tablet?.derived, true);
    assert.equal(served.canvases.phone?.derived, true);
    snapshot(`derived.${doc.name}`, served);
  });
}

for (const doc of examples) {
  test(`the example ${doc.universe} ${doc.name} passes and is served with its derived canvases`, () => {
    const { refusals, document } = checkLayout(doc, { kind: kindOfLayout(doc.universe, doc.name), registry });
    assert.deepEqual(refusals, []);
    snapshot(`example.${doc.name}`, document);
  });
}

test('plaza: the phone canvas derived, the agenda in the END rail (universe-layouts.feature)', () => {
  const plaza = examples.find((d) => d.name === 'plaza')!;
  const phone = derivePhone(plaza.canvases.desktop, registry);
  assert.deepEqual(brief(phone.items), ['identityBar:full@1,1+4', 'timeColumn:button@2,1+1', 'rulesPost:full@3,1+4', 'feed:full@4,1+4']);
  assert.deepEqual(phone.rails, [{ id: 'end', side: 'END', folded: true }]);
  assert.deepEqual(phone.items.filter((i) => i.rail).map((i) => [i.widget, i.behavior?.kind, i.contextual]), [['agenda', 'OPEN', 'button']]);
  assert.equal(phone.addressBar, 'top');
  // The layout switcher has no live button: hidden on the phone.
  assert.ok(phone.items.some((i) => i.widget === 'layoutSwitcher' && i.variant === 'hidden'));
});

test('the tablet derived: the feed over 5 of 8 columns in medium, the time column over the other 3 (universe-layouts.feature)', () => {
  const feedFirst = examples.find((d) => d.name === 'feed-first')!;
  const tablet = deriveTablet(feedFirst.canvases.desktop, registry, 'public');
  assert.ok(brief(tablet.items).includes('feed:medium@4,1+5'));
  assert.ok(brief(tablet.items).includes('timeColumn:compact@2,6+3x3'));
});

test('the phone derived from a desktop with the agenda and Who governs stows them as live buttons', () => {
  const doc = desktopOnly(platform.find((d) => d.name === 'feed-first')!);
  doc.canvases.desktop = { ...doc.canvases.desktop, items: [...doc.canvases.desktop.items, { widget: 'agenda', variant: 'compact', row: 6, col: 9, cols: 4 }, { widget: 'whoGoverns', variant: 'compact', row: 7, col: 9, cols: 4 }] };
  const phone = deriveLayout(doc, registry).canvases.phone!;
  assert.deepEqual(brief(phone.items), ['identityBar:full@1,1+4', 'timeColumn:button@2,1+1', 'rulesPost:full@3,1+4', 'headRow:full@4,1+4', 'feed:full@5,1+4']);
  assert.deepEqual(phone.items.filter((i) => i.rail === 'end').map((i) => i.widget), ['agenda', 'whoGoverns']);
});

test('a row that no longer fits on the tablet moves its last items to a new row under it; a live line placed before v99.0.0 is left out', () => {
  const doc = desktopOnly(platform.find((d) => d.name === 'feed-first')!);
  // Three compact widgets of 4 columns on one row: 3 + 3 + 3 > 8 on the tablet.
  doc.canvases.desktop = {
    columns: 12, rails: [], items: [
      { widget: 'identityBar', variant: 'full', row: 1, col: 1, cols: 12 }, { widget: 'liveLine', variant: 'full', row: 2, col: 1, cols: 12 },
      { widget: 'agenda', variant: 'compact', row: 3, col: 1, cols: 4 }, { widget: 'projects', variant: 'compact', row: 3, col: 5, cols: 4 }, { widget: 'debates', variant: 'compact', row: 3, col: 9, cols: 4 },
      { widget: 'rulesPost', variant: 'full', row: 4, col: 1, cols: 8 }, { widget: 'feed', variant: 'wide', row: 5, col: 1, cols: 8 }, { widget: 'timeColumn', variant: 'compact', row: 4, col: 9, cols: 4, rows: 2 },
    ],
  };
  assert.deepEqual(checkLayout(doc, { kind: 'public', registry }).refusals, []);
  const tablet = deriveLayout(doc, registry).canvases.tablet!;
  assert.deepEqual(brief(tablet.items), [
    'identityBar:full@1,1+8', 'agenda:compact@3,1+3', 'projects:compact@3,4+3', 'debates:compact@4,1+3',
    'rulesPost:full@5,1+5', 'timeColumn:compact@5,6+3x2', 'feed:medium@6,1+5',
  ]);
});

test('beyond the budget of 6 on the tablet, the last widgets become live buttons of the END rail', () => {
  const doc = desktopOnly(platform.find((d) => d.name === 'feed-first')!);
  const extra: LayoutItem[] = ['agenda', 'projects', 'debates', 'clips', 'map', 'whoGoverns'].map((widget, i) => ({ widget, variant: 'compact', row: 5 + i, col: 9, cols: 4 }));
  doc.canvases.desktop = { ...doc.canvases.desktop, items: [...doc.canvases.desktop.items, ...extra] };
  const { refusals, document } = checkLayout(doc, { kind: 'public', registry });
  assert.deepEqual(refusals, []);
  const tablet = document!.canvases.tablet!;
  assert.deepEqual(tablet.items.filter((i) => i.rail).map((i) => i.widget), ['map', 'whoGoverns']);
  assert.deepEqual(tablet.rails, [{ id: 'end', side: 'END', folded: true }]);
});

test('the refusals of the shape and of the invariants carry the codes of the contract', () => {
  const base = platform.find((d) => d.name === 'feed-first')!;
  const codes = (doc: unknown, kind: 'public' | 'private' = 'public') => [...new Set(checkLayout(doc, { kind, registry }).refusals.map((r) => r.code))];
  assert.deepEqual(codes({ ...base, format: 'break-rocks-layout/2' }), ['LAYOUT_FORMAT_INVALID']);
  assert.deepEqual(codes({ ...base, name: '1x' }), ['LAYOUT_NAME_INVALID']);
  assert.deepEqual(codes({ ...base, description: 'x'.repeat(161) }), ['LAYOUT_DESCRIPTION_TOO_LONG']);
  assert.deepEqual(codes({ ...base, derive: true, canvases: { phone: base.canvases.phone } }), ['LAYOUT_DESKTOP_MISSING']);
  assert.deepEqual(codes({ ...base, canvases: { desktop: base.canvases.desktop, tablet: null, phone: base.canvases.phone } }), ['LAYOUT_CANVAS_MISSING']);
  assert.deepEqual(codes({ ...base, description: 'x', canvases: { ...base.canvases, desktop: { ...base.canvases.desktop, columns: 10 } } }), ['LAYOUT_COLUMNS_INVALID']);
  assert.deepEqual(codes({ ...base, canvases: { ...base.canvases, desktop: { ...base.canvases.desktop, addressBar: 'bottom' } } }), ['LAYOUT_FRAME_INVALID']);
  assert.deepEqual(codes({ ...base, big: 'x'.repeat(70_000) }), ['LAYOUT_TOO_LARGE']);
  const phone = base.canvases.phone!;
  const onPhone = (change: (items: LayoutItem[]) => LayoutItem[], rails = phone.rails) => ({ ...base, canvases: { ...base.canvases, phone: { ...phone, rails, items: change(phone.items.map((i) => ({ ...i }))) } } });
  const endRail = [{ id: 'end', side: 'END' as const, folded: true }];
  const stow = (widget: string) => (items: LayoutItem[]) => items.map((i) => (i.widget === widget ? { widget, variant: 'button' as const, rail: 'end' } : i));
  assert.deepEqual(codes(onPhone((items) => items.map((i) => (i.widget === 'identityBar' ? { widget: 'identityBar', variant: 'hidden' as const } : i)))), ['LAYOUT_IDENTITY_REQUIRED']);
  // Invariant 2 withdrawn since v99.0.0: no live line required, one placed anyhow is ignored.
  assert.deepEqual(codes(onPhone((items) => items.filter((i) => i.widget !== 'liveLine'))), []);
  assert.deepEqual(codes(onPhone((items) => [...items, { widget: 'liveLine', variant: 'button', rail: 'end' }], endRail)), []);
  assert.deepEqual(codes(onPhone(stow('timeColumn'), endRail)), ['LAYOUT_TIME_COLUMN_REQUIRED']);
  assert.deepEqual(codes(onPhone(stow('feed'), endRail)), ['LAYOUT_FEED_REQUIRED']);
  // A private universe has no time column nor rules post: feed-first-private is checked as such.
  assert.deepEqual(codes(platform.find((d) => d.name === 'feed-first-private'), 'private'), []);
  assert.deepEqual(codes(platform.find((d) => d.name === 'feed-first-private'), 'public'), ['LAYOUT_TIME_COLUMN_REQUIRED', 'LAYOUT_RULES_POST_REQUIRED']);
});

test('every invalid example is refused with the code of its name', () => {
  for (const file of files('examples/layouts/invalid/').filter((f) => !f.startsWith('schema.'))) {
    const doc = json<LayoutDocument>(`examples/layouts/invalid/${file}`);
    const codes = checkLayout(doc, { kind: kindOfLayout(doc.universe, doc.name), registry }).refusals.map((r) => r.code);
    assert.ok(codes.includes(file.split('.')[0]), `${file}: ${codes.join(', ')}`);
  }
  for (const file of files('examples/layouts/invalid/').filter((f) => f.startsWith('schema.'))) {
    const doc = json<LayoutDocument>(`examples/layouts/invalid/${file}`);
    assert.ok(checkLayout(doc, { kind: 'public', registry }).refusals.length > 0, file);
  }
});

test('a widget that joins the registry after a layout is added as a live button of the END rail', () => {
  const next = registry.registryVersion + 1;
  const later: WidgetRegistry = {
    ...registry, registryVersion: next,
    widgets: { ...registry.widgets, polls: { ...registry.widgets.agenda, name: 'polls', since: next, contextual: null } },
  };
  const served = deriveLayout(platform.find((d) => d.name === 'feed-first')!, registry);
  const completed = applyRegistry(served, later);
  assert.equal(completed.registryVersion, next);
  for (const name of ['desktop', 'tablet', 'phone'] as const) {
    const canvas = completed.canvases[name]!;
    assert.deepEqual(canvas.items.filter((i) => i.widget === 'polls'), [{ widget: 'polls', variant: 'button', rail: 'end', behavior: { kind: 'OPEN' } }]);
    assert.deepEqual(canvas.rails, [{ id: 'end', side: 'END', folded: true }]);
    assert.deepEqual(canvas.items.filter((i) => i.widget !== 'polls'), served.canvases[name]!.items);
  }
  assert.equal(applyRegistry(completed, later), completed);
});

test('the reader retouches: stow, show, another variant; a required widget stays', () => {
  const village = deriveLayout(platform.find((d) => d.name === 'village-square')!, registry);
  const context = { kind: 'public' as const, registry };
  const stowed = applyRetouches(village, [{ canvas: 'DESKTOP', widget: 'whoGoverns', state: 'STOWED' }], context);
  assert.deepEqual(stowed.refusals, []);
  assert.deepEqual(stowed.document.canvases.desktop.items.find((i) => i.widget === 'whoGoverns'), { widget: 'whoGoverns', variant: 'button', rail: 'end', behavior: { kind: 'OPEN' } });
  const shown = applyRetouches(stowed.document, [{ canvas: 'DESKTOP', widget: 'whoGoverns', state: 'SHOWN' }], context);
  assert.deepEqual(shown.refusals, []);
  assert.equal(shown.document.canvases.desktop.items.find((i) => i.widget === 'whoGoverns')?.variant, 'medium');
  const variant = applyRetouches(village, [{ canvas: 'TABLET', widget: 'whoGoverns', variant: 'compact' }], context);
  assert.deepEqual(variant.refusals, []);
  assert.deepEqual(variant.document.canvases.tablet!.items.find((i) => i.widget === 'whoGoverns'), { widget: 'whoGoverns', variant: 'compact', row: 5, col: 1, cols: 3 });
  assert.deepEqual(applyRetouches(village, [{ canvas: 'PHONE', widget: 'feed', state: 'STOWED' }], context).refusals.map((r) => r.code), ['LAYOUT_RETOUCH_INVALID']);
  assert.deepEqual(applyRetouches(village, Array.from({ length: 51 }, () => ({ canvas: 'PHONE' as const, widget: 'pulse', state: 'SHOWN' as const })), context).refusals.map((r) => r.code), ['LAYOUT_RETOUCH_INVALID']);
  // A retouch of a widget the layout no longer has is left out.
  assert.deepEqual(applyRetouches(village, [{ canvas: 'DESKTOP', widget: 'channels', state: 'STOWED' }], context).applied, []);
});

// ---- The dashboard (registryVersion 3, specs v69.0.0 to v71.0.0; light since specs v79.0.0) ----

const hud = () => JSON.parse(JSON.stringify(platform.find((d) => d.name === 'hud')!)) as LayoutDocument;
const codesOf = (doc: unknown, kind: 'public' | 'private' | 'root' = 'public') => [...new Set(checkLayout(doc, { kind, registry }).refusals.map((r) => r.code))];

test('hud (specs v79.0.0): its phone places no time column, the now page shows it (invariant 3); any other layout places one', () => {
  const doc = hud();
  assert.deepEqual(codesOf(doc), []);
  assert.ok(!doc.canvases.phone!.items.some((i) => i.widget === 'timeColumn'));
  // The same canvases in another layout: the time column is required on the phone.
  assert.deepEqual(codesOf({ ...hud(), name: 'tableau' }), ['LAYOUT_TIME_COLUMN_REQUIRED']);
  assert.deepEqual(codesOf({ ...hud(), universe: '%paris' }), ['LAYOUT_TIME_COLUMN_REQUIRED']);
  // hud on the desktop still places it.
  const desktop = hud();
  desktop.canvases.desktop.items = desktop.canvases.desktop.items.filter((i) => i.widget !== 'timeColumn');
  assert.deepEqual(codesOf(desktop), ['LAYOUT_TIME_COLUMN_REQUIRED']);
});

test('the time column as a live button in a pinned rail of a phone (invariant 3), never in a folded one', () => {
  const doc = { ...hud(), name: 'tableau' };
  const phone = doc.canvases.phone!;
  phone.rails!.push({ id: 'start', side: 'START', folded: true, pinned: true });
  phone.items.push({ widget: 'timeColumn', variant: 'button', rail: 'start', behavior: { kind: 'OPEN' } });
  assert.deepEqual(codesOf(doc), []);
  phone.rails = phone.rails!.map((r) => (r.id === 'start' ? { id: 'start', side: 'START', folded: true } : r));
  assert.deepEqual(codesOf(doc), ['LAYOUT_TIME_COLUMN_REQUIRED']);
  // Expanded from a rail: never.
  phone.rails = phone.rails!.map((r) => (r.id === 'start' ? { ...r, pinned: true } : r));
  phone.items = phone.items.map((i) => (i.widget === 'timeColumn' ? { ...i, behavior: { kind: 'EXPAND' } } : i));
  assert.deepEqual(codesOf(doc), ['LAYOUT_BEHAVIOR_INVALID']);
  // pinned and contextual are booleans.
  for (const key of ['pinned', 'contextual']) {
    const bad = hud() as unknown as { canvases: { phone: { rails: Record<string, unknown>[] } } };
    bad.canvases.phone.rails[0][key] = 'yes';
    assert.deepEqual(codesOf(bad), ['LAYOUT_RAIL_INVALID'], key);
  }
});

test('hud: the contextual rail of the phone, the contextual live buttons above the time column of a tablet and a desktop', () => {
  const doc = hud();
  assert.deepEqual(doc.canvases.phone!.rails, [{ id: 'end', side: 'END', folded: true, pinned: true, contextual: true }]);
  assert.deepEqual(doc.canvases.phone!.items.filter((i) => i.rail === 'end').map((i) => i.widget), ['channels', 'headRow', 'toHandle']);
  for (const name of ['desktop', 'tablet'] as const) {
    const canvas = doc.canvases[name]!;
    assert.equal(canvas.rails, undefined, name);
    assert.deepEqual(canvas.items.filter((i) => i.contextual === 'hidden').map((i) => i.widget), ['channels', 'headRow', 'toHandle'], name);
  }
  // The head row as a live button on the canvas: contextual only.
  const plain = hud();
  plain.canvases.desktop.items = plain.canvases.desktop.items.map((i) => (i.widget === 'headRow' ? { ...i, contextual: null } : i));
  assert.deepEqual(codesOf(plain), ['LAYOUT_RAIL_INVALID']);
  const switching = hud();
  switching.canvases.phone!.items = switching.canvases.phone!.items.map((i) => (i.widget === 'headRow' ? { ...i, behavior: { kind: 'SWITCH', focus: 'POSTS' } } : i));
  assert.deepEqual(codesOf(switching), ['LAYOUT_BEHAVIOR_INVALID']);
  // A widget that may not be contextual.
  const governs = hud();
  governs.canvases.desktop.items.push({ widget: 'whoGoverns', variant: 'button', row: 2, col: 12, cols: 1, contextual: 'hidden' });
  assert.deepEqual(codesOf(governs), ['LAYOUT_CONTEXTUAL_INVALID']);
  // On the canvas, the head row of feed-first stays full over any width, not counted in the budget.
  const feedFirst = platform.find((d) => d.name === 'feed-first')!;
  assert.ok(feedFirst.canvases.tablet!.items.some((i) => i.widget === 'headRow' && i.variant === 'full' && i.cols === 5));
  assert.deepEqual(codesOf(feedFirst), []);
});

test('the open votes on the page of a universe as a live button only (LAYOUT_WIDGET_NOT_ON_PAGE)', () => {
  const doc = hud();
  doc.canvases.desktop.items.push({ widget: 'openVotes', variant: 'compact', row: 5, col: 9, cols: 4 });
  assert.deepEqual(codesOf(doc), ['LAYOUT_WIDGET_NOT_ON_PAGE']);
  doc.canvases.desktop.items = doc.canvases.desktop.items.map((i) => (i.widget === 'openVotes' ? { widget: 'openVotes', variant: 'button', row: 5, col: 9, cols: 1 } : i));
  assert.deepEqual(codesOf(doc), []);
});

test('the four focus of a live button (specs v79.0.0); a focus of before served OPEN', () => {
  const doc = hud();
  doc.canvases.desktop.rails = [{ id: 'end', side: 'END', folded: false }];
  doc.canvases.desktop.items.push({ widget: 'map', variant: 'button', rail: 'end', behavior: { kind: 'SWITCH', focus: 'MAP' } });
  doc.canvases.desktop.items.push({ widget: 'debates', variant: 'button', rail: 'end', behavior: { kind: 'SWITCH', focus: 'DEBATES' } });
  doc.canvases.desktop.items.push({ widget: 'whoGoverns', variant: 'compact', row: 5, col: 9, cols: 4, params: { style: 'gallery' } });
  assert.deepEqual(codesOf(doc), []);
  assert.ok(registry.widgets.channels.offeredIn.includes('public'));
  for (const focus of [...OLD_FOCUS, 'ATLAS']) {
    const old = hud();
    old.canvases.desktop.rails = [{ id: 'end', side: 'END', folded: false }];
    old.canvases.desktop.items.push({ widget: 'agenda', variant: 'button', rail: 'end', behavior: { kind: 'SWITCH', focus } });
    assert.deepEqual(codesOf(old), ['LAYOUT_BEHAVIOR_INVALID'], focus);
  }
  const served = deriveLayout(hud(), registry);
  assert.equal(withoutOldFocus(served), served);
  served.canvases.desktop.items.push({ widget: 'agenda', variant: 'button', rail: 'end', behavior: { kind: 'SWITCH', focus: 'AGENDA' } });
  const open = withoutOldFocus(served);
  assert.deepEqual(open.canvases.desktop.items.at(-1), { widget: 'agenda', variant: 'button', rail: 'end', behavior: { kind: 'OPEN' } });
  assert.deepEqual(open.canvases.phone, served.canvases.phone);
});

test('since v99.0.0, a live line placed before is ignored with its gestures turn and step; turn and step are refused on a widget placed', () => {
  const doc = hud();
  doc.canvases.phone!.items = [...doc.canvases.phone!.items, { widget: 'liveLine', variant: 'full', row: 2, col: 1, cols: 4, gestures: { doubleTap: 'turn', longPress: 'step' } }];
  assert.deepEqual(codesOf(doc), []);
  const served = deriveLayout(desktopOnly({ ...doc, canvases: { ...doc.canvases, desktop: { ...doc.canvases.desktop, items: [...doc.canvases.desktop.items, { widget: 'liveLine', variant: 'medium', row: 9, col: 1, cols: 6 }] } } }), registry);
  for (const name of ['tablet', 'phone'] as const) assert.ok(!served.canvases[name]!.items.some((i) => i.widget === 'liveLine'), name);
  const retouched = applyRetouches(served, [{ canvas: 'DESKTOP', widget: 'liveLine', state: 'STOWED' }], { kind: 'public', registry });
  assert.deepEqual([retouched.refusals, retouched.applied], [[], []]);
  for (const action of ['turn', 'step']) {
    const feed = hud();
    feed.canvases.phone!.items = feed.canvases.phone!.items.map((i) => (i.widget === 'feed' ? { ...i, gestures: { doubleTap: action } } : i));
    assert.deepEqual(codesOf(feed), ['LAYOUT_GESTURE_INVALID'], action);
  }
});

test('hud derived from its desktop canvas only: the phone of the derivation, the contextual live buttons in one END rail', () => {
  const served = deriveLayout(desktopOnly(hud()), registry);
  const phone = served.canvases.phone!;
  assert.deepEqual(brief(phone.items), ['identityBar:full@1,1+4', 'timeColumn:button@2,1+1', 'rulesPost:full@3,1+4', 'feed:full@4,1+4']);
  assert.deepEqual(phone.items.filter((i) => i.rail === 'end').map((i) => [i.widget, i.contextual]), [['channels', 'hidden'], ['headRow', 'hidden'], ['toHandle', 'hidden']]);
});

test('registryVersion 3: a layout of version 1 is completed with the governance widgets, never the open votes, the members nor "to handle"', () => {
  const served = { ...deriveLayout(platform.find((d) => d.name === 'feed-first')!, registry), registryVersion: 1 };
  const completed = applyRegistry(served, registry);
  assert.equal(completed.registryVersion, 3);
  assert.deepEqual(completed.canvases.phone!.items.filter((i) => i.rail).map((i) => i.widget), ['proposals', 'myDuties', 'rules', 'pinnedChannels', 'governanceHistory']);
  const priv = { ...deriveLayout(platform.find((d) => d.name === 'feed-first-private')!, registry), registryVersion: 1 };
  assert.deepEqual(applyRegistry(priv, registry).canvases.desktop.items.filter((i) => i.rail).map((i) => i.widget), ['rules', 'pinnedChannels']);
  // A layout of version 2 gains nothing: the widgets of version 3 are placed by the layouts.
  const two = { ...served, registryVersion: 2 };
  assert.deepEqual(applyRegistry(two, registry).canvases, two.canvases);
});

test('pinnedChannels is offered in the private and the public universes, required in none, and the root universe has none', () => {
  const w = registry.widgets.pinnedChannels;
  assert.deepEqual(w.offeredIn, ['private', 'public']);
  assert.deepEqual(w.requiredIn, []);
});

test('the reader retouches of hud: a contextual live button stowed, the open votes shown as a live button only', () => {
  const served = deriveLayout(hud(), registry);
  const context = { kind: 'public' as const, registry };
  const stowed = applyRetouches(served, [{ canvas: 'DESKTOP', widget: 'channels', state: 'STOWED' }], context);
  assert.deepEqual(stowed.refusals, []);
  assert.deepEqual(stowed.document.canvases.desktop.items.find((i) => i.widget === 'channels'), { widget: 'channels', variant: 'button', contextual: 'hidden', rail: 'end', behavior: { kind: 'OPEN' } });
  const withVotes = deriveLayout(hud(), registry);
  withVotes.canvases.desktop.rails = [{ id: 'end', side: 'END', folded: true }];
  withVotes.canvases.desktop.items.push({ widget: 'openVotes', variant: 'button', rail: 'end', behavior: { kind: 'OPEN' } });
  const votes = applyRetouches(withVotes, [{ canvas: 'DESKTOP', widget: 'openVotes', state: 'SHOWN' }], context);
  assert.deepEqual(votes.refusals, []);
  assert.equal(votes.document.canvases.desktop.items.find((i) => i.widget === 'openVotes')?.variant, 'button');
  assert.deepEqual(applyRetouches(votes.document, [{ canvas: 'DESKTOP', widget: 'openVotes', variant: 'compact' }], context).refusals.map((r) => r.code), ['LAYOUT_RETOUCH_INVALID']);
  // The time column of a public universe is never stowed by a retouch; the phone of hud has none to retouch.
  assert.deepEqual(applyRetouches(served, [{ canvas: 'DESKTOP', widget: 'timeColumn', state: 'STOWED' }], context).refusals.map((r) => r.code), ['LAYOUT_RETOUCH_INVALID']);
  assert.deepEqual(applyRetouches(served, [{ canvas: 'PHONE', widget: 'toHandle', state: 'STOWED' }], context).refusals, []);
});

// ---- The pages of a universe (since design v2.9.0) ----

for (const doc of pagePlatform) {
  test(`the platform layout ${doc.name} of the page ${doc.page} passes checkPageLayout and is served with its derived canvases`, () => {
    const { refusals, document } = checkPageLayout(doc, { registry });
    assert.deepEqual(refusals, []);
    assert.equal(document!.page, doc.page);
    assert.equal(document!.registryVersion, registry.registryVersion);
    assert.equal(document!.canvases.tablet?.derived, true);
    assert.equal(document!.canvases.phone?.derived, true);
    // The phone: one item per row, in full.
    assert.ok(document!.canvases.phone!.items.every((i, n) => i.variant === 'full' && i.row === n + 1 && i.cols === 4));
    snapshot(`page.${doc.name}`, document);
  });
}

test('the free blocks and the navigation widget are in the registry, version 2, never added to a layout published before', () => {
  for (const w of [...FREE_BLOCKS, 'navigation']) {
    const entry = registry.widgets[w];
    assert.ok(entry, w);
    assert.equal(entry.since, 2, w);
    assert.equal(entry.completion, false, w);
    assert.deepEqual(entry.offeredIn, ['public', 'private'], w);
    assert.ok(w === 'navigation' || entry.surfaces.includes('block'), w);
  }
  const served = { ...deriveLayout(platform.find((d) => d.name === 'feed-first')!, registry), registryVersion: 1 };
  const added = applyRegistry(served, registry).canvases.desktop.items.map((i) => i.widget);
  for (const w of [...FREE_BLOCKS, 'navigation']) assert.ok(!added.includes(w), w);
});

test('a free block is refused on the page of a universe and on the governance page, accepted on a custom page', () => {
  const block: PageItem = { widget: 'textBlock', variant: 'full', row: 3, col: 1, cols: 12, id: 'intro', content: { text: '## Welcome' } };
  const home = desktopOnly(platform.find((d) => d.name === 'feed-first')!);
  home.canvases.desktop = { ...home.canvases.desktop, items: [...home.canvases.desktop.items.map((i) => (i.row && i.row >= 3 ? { ...i, row: i.row + 1 } : i)), block] };
  assert.ok(checkPageCanvases(home, 'home', { kind: 'public', registry }).refusals.some((r) => r.code === 'LAYOUT_WIDGET_NOT_ON_PAGE' && r.widget === 'textBlock'));
  const governance = pagePlatform.find((d) => d.name === 'governance')!;
  const withBlock = { ...governance, canvases: { desktop: { ...governance.canvases.desktop, items: [...governance.canvases.desktop.items, { ...block, row: 7 }] }, tablet: null, phone: null } };
  assert.ok(checkPageCanvases(withBlock, 'governance', { kind: 'public', registry }).refusals.some((r) => r.code === 'LAYOUT_WIDGET_NOT_ON_PAGE' && r.widget === 'textBlock'));
  const frame: PageItem[] = [{ widget: 'identityBar', variant: 'full', row: 1, col: 1, cols: 12 }, { widget: 'liveLine', variant: 'full', row: 2, col: 1, cols: 12 }];
  const custom: { derive: boolean; canvases: LayoutDocument['canvases'] } = { derive: true, canvases: { desktop: { columns: 12, items: [...frame, block, { widget: 'separatorBlock', variant: 'full', row: 4, col: 1, cols: 12, id: 'line' } as PageItem], rails: [] }, tablet: null, phone: null } };
  const checked = checkPageCanvases(custom, 'custom', { kind: 'public', registry });
  assert.deepEqual(checked.refusals, []);
  assert.deepEqual(checked.document!.canvases.phone!.items.map((i) => `${i.widget}@${i.row}`), ['identityBar@1', 'textBlock@2', 'separatorBlock@3']);
  // P5: a page with text blocks has a heading of level 2.
  const noHeading = { ...custom, canvases: { ...custom.canvases, desktop: { ...custom.canvases.desktop, items: [...frame, { ...block, content: { text: 'plain' } }] } } };
  assert.deepEqual(checkPageCanvases(noHeading, 'custom', { kind: 'public', registry }).refusals.map((r) => r.code), ['PAGE_HEADING_REQUIRED']);
});

test('the governance page requires its blocks (G2), and at most one main menu is placed', () => {
  const governance = pagePlatform.find((d) => d.name === 'governance')!;
  const without = { ...governance, canvases: { desktop: { ...governance.canvases.desktop, items: governance.canvases.desktop.items.filter((i) => i.widget !== 'proposals') }, tablet: null, phone: null } };
  assert.deepEqual(checkPageCanvases(without, 'governance', { kind: 'public', registry }).refusals.map((r) => [r.code, r.widget]), [['LAYOUT_GOVERNANCE_BLOCK_REQUIRED', 'proposals']]);
  const menu = (row: number): PageItem => ({ widget: 'navigation', variant: 'full', row, col: 1, cols: 12, params: { role: 'main', format: 'tabs' } });
  const twoMenus = { derive: true, canvases: { desktop: { columns: 12, items: [menu(1), menu(2)], rails: [] }, tablet: null, phone: null } };
  assert.ok(checkPageCanvases(twoMenus, 'custom', { kind: 'public', registry }).refusals.some((r) => r.code === 'NAVIGATION_MAIN_DUPLICATE'));
  const bottomBar = { derive: true, canvases: { desktop: { columns: 12, items: [{ ...menu(1), params: { format: 'bottomBar' } }], rails: [] }, tablet: null, phone: null } };
  assert.ok(checkPageCanvases(bottomBar, 'custom', { kind: 'public', registry }).refusals.some((r) => r.code === 'NAVIGATION_FORMAT_INVALID'));
});

test('a platform layout of a page that is not one is refused (LAYOUT_PAGE_INVALID)', () => {
  assert.deepEqual(checkPageLayout({ ...pagePlatform[0], page: 'now' }, { registry }).refusals.map((r) => r.code), ['LAYOUT_PAGE_INVALID']);
});
