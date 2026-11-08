// Tests of the shared library of the themes (lib/theme/index.ts) and of the formulas the tokens carry
// (monogramColor, the families). Usage: node --test lib/theme/theme.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { families, formerSurfaces, hueOfColor, maskOpacity, monogramColor, readTheme, removedSurfaces, themeHooks } from './index.ts';
import { colors, mask, surfaceKeys, surfaces } from '../../dist/web/tokens.ts';
import { MONOGRAM_VECTORS } from './monogram-vectors.ts';

const ROOT = new URL('../../', import.meta.url);
const json = (path: string) => JSON.parse(readFileSync(new URL(path, ROOT), 'utf8'));

test('the four families and the former theme surfaces of the contract', () => {
  assert.deepEqual([...families], ['page', 'sky', 'block', 'control']);
  assert.deepEqual(formerSurfaces.block, ['widget', 'quoteCard', 'timeColumnCard', 'headRow', 'channelHeader', 'channelBubble', 'rail', 'block']);
  assert.deepEqual(Object.keys(removedSurfaces), ['postCard', 'repostCard', 'replyCard', 'liveLine', 'focusBar', 'divider']);
  for (const key of Object.keys(removedSurfaces)) assert.ok(!(surfaceKeys as readonly string[]).includes(key), `${key} is no theme surface`);
});

test('a deprecated alias resolves to its family', () => {
  for (const mode of ['night', 'dim', 'day'] as const) {
    for (const alias of ['widget', 'timeColumnCard', 'channelBubble', 'rail', 'quoteCard', 'headRow', 'channelHeader'] as const) assert.deepEqual(surfaces[mode][alias], surfaces[mode].block);
    assert.deepEqual(surfaces[mode].pageHeader, surfaces[mode].sky);
    assert.equal(surfaces[mode].primaryButton.background, surfaces[mode].control.background);
  }
});

test('a theme with the families is read as is', () => {
  const read = readTheme(json('examples/themes/faille.json'));
  assert.deepEqual(read.variants.night.families.block, { background: '#1A0F2E', text: '#F2F4F7', secondaryText: '#B8B2C8' });
  assert.deepEqual(read.variants.day.families.sky, undefined);
  assert.deepEqual(read.ignored, []);
  assert.deepEqual(themeHooks(read, 'day'), {
    '--theme-surface-block-bg': '#FBF2FF', '--theme-surface-block-text': '#14171C', '--theme-surface-block-muted': '#5A4E66',
    '--theme-surface-control-bg': '#B0129A', '--theme-surface-control-text': '#FFFFFF',
  });
});

test('a theme written before v99.0.0 is read into the families, without error', () => {
  const read = readTheme(json('examples/themes/faille-v48.json'));
  // night: postCard is gone; the block is the time column card (the first of its row given), the control the primary button.
  assert.deepEqual(read.variants.night.readFrom, { block: 'timeColumnCard', control: 'primaryButton' });
  assert.deepEqual(read.variants.night.families.block, { background: '#20123A' });
  assert.deepEqual(read.variants.night.families.control, { background: '#FF2BD6', text: '#0E1116' });
  assert.deepEqual(read.variants.day.readFrom, { control: 'primaryButton' });
  assert.ok(read.ignored.includes('variants.night.surfaces.postCard (a post has no card: it lies on the page, 24 px from the next)'));
  assert.ok(read.ignored.includes('variants.night.surfaces.postCard.border') === false, 'a removed surface is ignored whole');
  assert.ok(read.ignored.includes('variants.night.surfaces.badge'), 'a former surface after the first of its row is ignored');
  for (const path of ['surfaceRadius', 'shape', 'typography.accent', 'imageSlots.timeColumn', 'imageSlots.channelHeader', 'imageSlots.cardTexture']) assert.ok(read.ignored.includes(path), path);
  assert.deepEqual(read.typography, { title: 'Bebas Neue' });
  assert.deepEqual(Object.keys(read.imageSlots), ['page', 'pageHeader']);
});

test('the border of a family is dropped', () => {
  const read = readTheme({ format: 'break-rocks-theme/2', variants: { night: { palette: {}, surfaces: { block: { background: '#101010', border: '#FF0000' } } }, day: { palette: {} } } });
  assert.deepEqual(read.variants.night.families.block, { background: '#101010' });
  assert.deepEqual(read.ignored, ['variants.night.surfaces.block.border']);
});

test('a family given goes before the former theme surfaces of its row', () => {
  const read = readTheme({ format: 'break-rocks-theme/2', variants: { night: { palette: {}, surfaces: { widget: { background: '#111111' }, block: { background: '#222222' } } }, day: { palette: {} } } });
  assert.deepEqual(read.variants.night.families.block, { background: '#222222' });
  assert.deepEqual(read.ignored, ['variants.night.surfaces.widget']);
});

test('a theme of the format 1 has no families: its palette only', () => {
  const read = readTheme(json('examples/themes/vestiaire.json'));
  assert.deepEqual(read.variants.night.families, {});
  assert.ok(read.ignored.includes('shape'));
  assert.ok(read.ignored.includes('images.texture'));
});

test('the monogram of an author: the test vectors, the same in the tokens and the build', () => {
  for (const [accent, account, mode, step, background] of MONOGRAM_VECTORS as [string, string, 'night' | 'day', number, string][]) {
    const got = monogramColor(hueOfColor(accent), account, mode);
    assert.equal(got.step, step);
    assert.equal(got.background, background);
  }
  assert.equal(monogramColor(9, 'A1B2C3D4-0000-4000-8000-000000000001', 'night').background, monogramColor(9, 'a1b2c3d4-0000-4000-8000-000000000001', 'night').background, 'lowercased');
});

test('two accounts in a universe get the colors of their steps, within its hue', () => {
  const hue = hueOfColor('#FF5A3C');
  const colors = new Set(Array.from({ length: 60 }, (_, i) => monogramColor(hue, `account-${i}`, 'day').background));
  assert.equal(colors.size, 6);
});

test('the mask over black and white pixels is the ceiling of the tokens, never below the floor', () => {
  const pixels: [number, number, number][] = [[0, 0, 0], [255, 255, 255]];
  for (const mode of ['night', 'dim', 'day'] as const) {
    const { text, textMuted: muted } = colors[mode];
    const opacity = maskOpacity({ page: mask[mode].color, texts: [{ color: text, min: 4.5 }, { color: muted, min: 4.5 }], pixels });
    assert.equal(opacity, mask[mode].ceiling);
  }
  // A quiet image of the color of the page needs no mask: the floor.
  const page = mask.day.color;
  const quiet: [number, number, number][] = [[parseInt(page.slice(1, 3), 16), parseInt(page.slice(3, 5), 16), parseInt(page.slice(5, 7), 16)]];
  assert.equal(maskOpacity({ page, texts: [{ color: colors.day.textMuted, min: 4.5 }], pixels: quiet, floor: mask.day.floor }), mask.day.floor);
});
