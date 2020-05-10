import hsla from './hsla';

test('hsla white', () => {
  expect(hsla(0, 1, 1, 1)).toMatchInlineSnapshot(`"hsla(0, 100%, 100%, 1)"`);
});

test('hsla red', () => {
  expect(hsla(0, 1, 0.5, 1)).toMatchInlineSnapshot(`"hsla(0, 100%, 50%, 1)"`);
});
