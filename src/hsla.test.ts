import hsla from './hsla';

test('hsla white', () => {
  expect(hsla(0, 1, 1, 1)).toMatchInlineSnapshot(`"hsla(0, 100%, 100%, 1)"`);
});

test('hsla red', () => {
  expect(hsla(0, 1, 0.5, 1)).toMatchInlineSnapshot(`"hsla(0, 100%, 50%, 1)"`);
});

test('hsla wraps any hue into 0 to 360', () => {
  expect(hsla(-480, 1, 0.5, 1)).toBe('hsla(240, 100%, 50%, 1)');
  expect(hsla(-720, 1, 0.5, 1)).toBe('hsla(0, 100%, 50%, 1)');
  expect(hsla(1080, 1, 0.5, 1)).toBe('hsla(0, 100%, 50%, 1)');
  expect(hsla(-0.2, 1, 0.5, 1)).toBe('hsla(360, 100%, 50%, 1)');
});

test('negative hues round like their positive equivalents', () => {
  // -0.50000000000001 + 360 is 359.49999999999999, which rounds to 359
  expect(hsla(-0.50000000000001, 1, 0.5, 1)).toBe('hsla(359, 100%, 50%, 1)');
  expect(hsla(-0.5, 1, 0.5, 1)).toBe('hsla(360, 100%, 50%, 1)');
  expect(hsla(-0.49999999999999, 1, 0.5, 1)).toBe('hsla(360, 100%, 50%, 1)');
  expect(hsla(-0.5000000001, 1, 0.5, 1)).toBe('hsla(359, 100%, 50%, 1)');
  expect(hsla(-359.5, 1, 0.5, 1)).toBe('hsla(1, 100%, 50%, 1)');
  expect(hsla(-359.50000000001, 1, 0.5, 1)).toBe('hsla(0, 100%, 50%, 1)');
  expect(hsla(-360.5, 1, 0.5, 1)).toBe('hsla(360, 100%, 50%, 1)');
  expect(hsla(-360.50000000001, 1, 0.5, 1)).toBe('hsla(359, 100%, 50%, 1)');
  // every negative half-degree matches the same hue plus 720
  for (let hue = -1000; hue < 0; hue += 0.5) {
    expect(hsla(hue, 1, 0.5, 1)).toBe(hsla(hue + 720, 1, 0.5, 1));
  }
});
