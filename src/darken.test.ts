import darken from './darken';

test('darken black (no-op)', () => {
  expect(darken('black', 0.1)).toMatchInlineSnapshot(`"hsla(0, 0%, 0%, 1)"`);
});

test('darken white', () => {
  expect(darken('white', 0.1)).toMatchInlineSnapshot(`"hsla(0, 0%, 90%, 1)"`);
  expect(darken('white', 0.2)).toMatchInlineSnapshot(`"hsla(0, 0%, 80%, 1)"`);
  expect(darken('white', 0.3)).toMatchInlineSnapshot(`"hsla(0, 0%, 70%, 1)"`);
  expect(darken('white', 0.4)).toMatchInlineSnapshot(`"hsla(0, 0%, 60%, 1)"`);
  expect(darken('white', 0.5)).toMatchInlineSnapshot(`"hsla(0, 0%, 50%, 1)"`);
  expect(darken('white', 0.6)).toMatchInlineSnapshot(`"hsla(0, 0%, 40%, 1)"`);
  expect(darken('white', 0.7)).toMatchInlineSnapshot(`"hsla(0, 0%, 30%, 1)"`);
  expect(darken('white', 0.8)).toMatchInlineSnapshot(`"hsla(0, 0%, 20%, 1)"`);
  expect(darken('white', 0.9)).toMatchInlineSnapshot(`"hsla(0, 0%, 10%, 1)"`);
  expect(darken('white', 1)).toMatchInlineSnapshot(`"hsla(0, 0%, 0%, 1)"`);
});

test('lighten black', () => {
  expect(darken('black', -0.1)).toMatchInlineSnapshot(`"hsla(0, 0%, 10%, 1)"`);
  expect(darken('black', -0.2)).toMatchInlineSnapshot(`"hsla(0, 0%, 20%, 1)"`);
  expect(darken('black', -0.3)).toMatchInlineSnapshot(`"hsla(0, 0%, 30%, 1)"`);
  expect(darken('black', -0.4)).toMatchInlineSnapshot(`"hsla(0, 0%, 40%, 1)"`);
  expect(darken('black', -0.5)).toMatchInlineSnapshot(`"hsla(0, 0%, 50%, 1)"`);
  expect(darken('black', -0.6)).toMatchInlineSnapshot(`"hsla(0, 0%, 60%, 1)"`);
  expect(darken('black', -0.7)).toMatchInlineSnapshot(`"hsla(0, 0%, 70%, 1)"`);
  expect(darken('black', -0.8)).toMatchInlineSnapshot(`"hsla(0, 0%, 80%, 1)"`);
  expect(darken('black', -0.9)).toMatchInlineSnapshot(`"hsla(0, 0%, 90%, 1)"`);
  expect(darken('black', -1)).toMatchInlineSnapshot(`"hsla(0, 0%, 100%, 1)"`);
});
