import lighten from './lighten';

test('black', () => {
  expect(lighten('black', 0.1)).toMatchInlineSnapshot(`"hsla(0, 0%, 10%, 1)"`);
});
