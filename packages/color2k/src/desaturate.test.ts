import desaturate from './desaturate';

test('red 10%', () => {
  expect(desaturate('red', 0.5)).toMatchInlineSnapshot(
    `"hsla(0, 50%, 50%, 1)"`
  );
});
