import adjustHue from './adjustHue';
import parseToRgba from './parseToRgba';

test('red 180', () => {
  expect(adjustHue('red', 180)).toMatchInlineSnapshot(
    `"hsla(180, 100%, 50%, 1)"`
  );
});

test('red 380', () => {
  expect(adjustHue('red', 360)).toMatchInlineSnapshot(
    `"hsla(0, 100%, 50%, 1)"`
  );
});

test('large negative and positive rotations wrap into 0 to 360', () => {
  expect(adjustHue('red', -480)).toBe('hsla(240, 100%, 50%, 1)');
  expect(adjustHue('red', -720)).toBe('hsla(0, 100%, 50%, 1)');
  expect(adjustHue('red', 1080)).toBe('hsla(0, 100%, 50%, 1)');
  expect(adjustHue('red', -30)).toBe('hsla(330, 100%, 50%, 1)');
  expect(parseToRgba(adjustHue('red', -480))).toEqual([0, 0, 255, 1]);
  expect(parseToRgba(adjustHue('red', -720))).toEqual([255, 0, 0, 1]);
  expect(parseToRgba(adjustHue('red', 1080))).toEqual([255, 0, 0, 1]);
  expect(parseToRgba(adjustHue('red', -30))).toEqual([255, 0, 128, 1]);
});

test('every negative rotation parses back', () => {
  for (let degrees = -1080; degrees <= 0; degrees += 7) {
    expect(parseToRgba(adjustHue('#336699', degrees))).toEqual(
      parseToRgba(adjustHue('#336699', degrees + 1080))
    );
  }
});
