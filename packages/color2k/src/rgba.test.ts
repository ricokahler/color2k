import rgba from './rgba';

test('red', () => {
  expect(rgba(255, 0, 0, 1)).toMatchInlineSnapshot(`"rgba(255, 0, 0, 1)"`);
});

test('blue with alpha', () => {
  expect(rgba(0, 0, 255, 0.5)).toMatchInlineSnapshot(`"rgba(0, 0, 255, 0.5)"`);
});
