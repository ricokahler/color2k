// taken from:
// https://github.com/styled-components/polished/blob/a23a6a2bb26802b3d922d9c3b67bac3f3a54a310/src/internalHelpers/_rgbToHsl.js
import parseToRgba from '@ricokahler/parse-to-rgba';

function parseToHsla(color: string): [number, number, number, number] {
  const [red, green, blue, alpha] = parseToRgba(color).map(
    (value) => value / 255
  );

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  // achromatic
  if (max === min) return [0, 0, lightness, alpha];

  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  const hue =
    60 *
    (red === max
      ? (green - blue) / delta + (green < blue ? 6 : 0)
      : green === max
      ? (blue - red) / delta + 2
      : (red - green) / delta + 4);

  return [hue, saturation, lightness, alpha];
}

export default parseToHsla;
