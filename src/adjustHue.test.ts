import adjustHue from './adjustHue';

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
