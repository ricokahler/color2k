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
  // to enable this to work in any environment, you can provide `color2kCompat`
  // globally as an escape hatch.
  // @ts-ignore
  if (typeof color2kCompat !== 'undefined') {
    // @ts-ignore
    return color2kCompat(color);
  }

  // for non-browser-environments, we'll use @color2k/compat
  if (
    (typeof navigator !== 'undefined' &&
      navigator.userAgent.includes('jsdom')) ||
    (typeof document === 'undefined' && typeof require !== 'undefined')
  ) {
    // Need to trick bundlers into _not_ bundling @color2k/compat. The
    // expression in the require statement makes it so that bundlers can't
    // statically resolve the dependency. It should be pulled on demand when
    // ran in a node environment.
    const someRandomExpression = '@color2k';
    const someRandomValue = (() => '/compat')();
    // @ts-ignore
    // eslint-disable-next-line
    return require(someRandomExpression + someRandomValue)(color);
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
