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
