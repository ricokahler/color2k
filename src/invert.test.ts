import invert from './invert';
import parseToRgba from './parseToRgba';

test('invert red', () => {
  expect(invert('red')).toBe('rgba(0, 255, 255, 1)');
});

test('keep alpha', () => {
  expect(invert('rgba(10, 20, 30, 0.4)')).toBe('rgba(245, 235, 225, 0.4)');
  expect(invert('#ff000080')).toBe('rgba(0, 255, 255, 0.502)');
});

test('edge colors', () => {
  expect(invert('black')).toBe('rgba(255, 255, 255, 1)');
  expect(invert('white')).toBe('rgba(0, 0, 0, 1)');
  expect(invert('transparent')).toBe('rgba(255, 255, 255, 0)');
  expect(invert('gray')).toBe('rgba(127, 127, 127, 1)');
});

// Expected values come from dart-sass 1.108.2, rounded to whole channels.
test('weight', () => {
  // invert(#336699, 25%) is rgb(35%, 45%, 55%): 89.25, 114.75, 140.25
  expect(invert('#336699', 0.25)).toBe('rgba(89, 115, 140, 1)');
  // invert(gray, 50%) is rgb(50%, 50%, 50%): 127.5
  expect(invert('gray', 0.5)).toBe('rgba(128, 128, 128, 1)');
  expect(invert('#336699', 0.5)).toBe('rgba(128, 128, 128, 1)');
  expect(invert('black', 0)).toBe('rgba(0, 0, 0, 1)');
  expect(invert('rgba(10, 20, 30, 0.4)', 1)).toBe('rgba(245, 235, 225, 0.4)');
});

test('inverting twice gives the original color back', () => {
  for (const color of ['#336699', 'rgba(10, 20, 30, 0.4)', 'transparent']) {
    expect(parseToRgba(invert(invert(color)))).toEqual(parseToRgba(color));
  }
});

test('output parses back', () => {
  expect(parseToRgba(invert('hsla(210, 50%, 40%, 0.25)'))).toEqual([
    204, 153, 102, 0.25,
  ]);
});
