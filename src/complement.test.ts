import complement from './complement';
import adjustHue from './adjustHue';
import parseToRgba from './parseToRgba';

test('complement red', () => {
  expect(complement('red')).toBe('hsla(180, 100%, 50%, 1)');
});

test('keep alpha', () => {
  // dart-sass: complement(rgba(51, 102, 153, 0.5)) is rgba(60%, 40%, 20%, 0.5)
  expect(complement('rgba(51, 102, 153, 0.5)')).toBe('hsla(30, 50%, 40%, 0.5)');
});

test('hues past 180 wrap around', () => {
  // dart-sass: complement(#b37a5c) is #5c95b3, i.e. [92, 149, 179]. The
  // `hsla` output rounds to whole degrees and percents, so channels can be
  // off by up to 5, as with adjustHue.
  expect(complement('#b37a5c')).toBe('hsla(201, 36%, 53%, 1)');
  expect(parseToRgba(complement('#b37a5c'))).toEqual([92, 148, 178, 1]);
  expect(complement('cyan')).toBe('hsla(0, 100%, 50%, 1)');
  // hues that round to 180 or 360 stay in range and parse back
  expect(complement('#ff0001')).toBe('hsla(180, 100%, 50%, 1)');
  expect(complement('#00fffe')).toBe('hsla(360, 100%, 50%, 1)');
  expect(parseToRgba(complement('#00fffe'))).toEqual([255, 0, 0, 1]);
});

test('grays keep their color, give or take 1 per channel', () => {
  for (let value = 0; value < 256; value += 1) {
    const [r, g, b] = parseToRgba(
      complement(`rgb(${value}, ${value}, ${value})`)
    );
    expect(r).toBe(g);
    expect(g).toBe(b);
    expect(Math.abs(r - value)).toBeLessThanOrEqual(1);
  }
});

test('edge colors have no hue and come back unchanged', () => {
  expect(parseToRgba(complement('black'))).toEqual([0, 0, 0, 1]);
  expect(parseToRgba(complement('white'))).toEqual([255, 255, 255, 1]);
  expect(parseToRgba(complement('gray'))).toEqual([128, 128, 128, 1]);
  expect(parseToRgba(complement('transparent'))).toEqual([0, 0, 0, 0]);
});

test('worst rounding case is 5 off the exact complement', () => {
  // the exact complement of [2, 4, 230] is [230, 228, 4]
  expect(parseToRgba(complement('rgb(2, 4, 230)'))).toEqual([227, 223, 2, 1]);
});

test('every hue parses back to its complement', () => {
  for (let hue = 0; hue < 360; hue += 1) {
    const [r, g, b] = parseToRgba(complement(`hsl(${hue}, 100%, 50%)`));
    const [r2, g2, b2] = parseToRgba(`hsl(${(hue + 180) % 360}, 100%, 50%)`);
    expect([r, g, b]).toEqual([r2, g2, b2]);
  }
});

test('complement of a rotated color parses back', () => {
  const rotated = adjustHue('#336699', -480);
  expect(parseToRgba(complement(rotated))).toEqual(
    parseToRgba(complement(adjustHue('#336699', 240)))
  );
});
