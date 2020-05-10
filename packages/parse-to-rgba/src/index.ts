import ColorError from './ColorError';

const cache: {
  [color: string]: [number, number, number, number];
} = {};

let ctx: CanvasRenderingContext2D | null = null;

function getContext() {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.getContext('2d');
}

/**
 * Parses a color using canvas
 *
 * Idea from `@Alnitak` this stackoverflow answer:
 * https://stackoverflow.com/a/19366389/5776910
 */
function parseToRgba(color: string): [number, number, number, number] {
  // for node-environments, we'll use @color2k/node
  if (typeof document === 'undefined') {
    /*START.TESTS_ONLY*/
    if (process.env.NODE_ENV === 'test') {
      // @ts-ignore
      return global.__parseToRgbaNode(color);
    }
    /*END.TESTS_ONLY*/
    return require('@color2k/node')(color);
  }

  // normalize the color
  const normalizedColor = color.toLowerCase().trim();

  if (cache[normalizedColor]) {
    return cache[normalizedColor];
  }

  ctx = ctx || getContext();

  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  ctx.clearRect(0, 0, 1, 1);
  // In order to detect invalid values,
  // we can't rely on col being in the same format as what fillStyle is computed as,
  // but we can ask it to implicitly compute a normalized value twice and compare.
  // https://stackoverflow.com/a/19366389/5776910
  ctx.fillStyle = '#000';
  ctx.fillStyle = normalizedColor;
  const computed = ctx.fillStyle;
  ctx.fillStyle = '#fff';
  ctx.fillStyle = normalizedColor;

  if (computed !== ctx.fillStyle) {
    throw new ColorError(color);
  }

  ctx.fillRect(0, 0, 1, 1);
  const result = Array.from(ctx.getImageData(0, 0, 1, 1).data) as [
    number,
    number,
    number,
    number
  ];
  const withNormalizedAlpha = [...result.slice(0, 3), result[3] / 255] as [
    number,
    number,
    number,
    number
  ];
  cache[normalizedColor] = withNormalizedAlpha;
  return withNormalizedAlpha;
}

parseToRgba.ColorError = ColorError;

export default parseToRgba;
