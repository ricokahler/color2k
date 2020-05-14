import ColorError from './ColorError';

const cache: {
  [color: string]: [number, number, number, number];
} = {};

let div: HTMLDivElement | null = null;

function createDiv() {
  const div = document.createElement('div');
  div.classList.add('color2k-parser');
  div.style.opacity = '0';
  div.style.pointerEvents = 'none';
  div.style.position = 'fixed';
  // div must be mounted for `getComputedStyle` to work
  document.body.appendChild(div);
  return div;
}

/**
 * Parses a color using `getComputedStyle`
 *
 * Idea from `Niet the Dark Absol`'s stackoverflow answer:
 * https://stackoverflow.com/a/11068286/5776910
 */
function parseToRgba(color: string): [number, number, number, number] {
  // for node-environments, we'll use @color2k/compat
  if (
    typeof document === 'undefined' ||
    navigator.userAgent.includes('jsdom')
  ) {
    // @ts-ignore
    if (typeof color2kCompat !== 'undefined') return color2kCompat(color);
    return require('@color2k/compat')(color);
  }

  // normalize the color
  const normalizedColor = color.toLowerCase().trim();

  if (cache[normalizedColor]) return cache[normalizedColor];

  div = div || createDiv();

  div.style.color = '#000';
  div.style.color = normalizedColor;
  const control = getComputedStyle(div).color;

  div.style.color = '#fff';
  div.style.color = normalizedColor;
  const computedColor = getComputedStyle(div).color;

  if (computedColor !== control) throw new ColorError(color);

  const result = computedColor
    .replace(/[^\d.,]/g, '')
    .split(',')
    .map(parseFloat) as [number, number, number, number];

  if (result.length < 4) {
    result.push(1);
  }

  cache[normalizedColor] = result;
  return result;
}

parseToRgba.ColorError = ColorError;

export default parseToRgba;
