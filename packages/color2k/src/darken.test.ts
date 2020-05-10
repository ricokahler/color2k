import darken from './darken';

test('darken white', () => {
  expect(darken('white', 0.1)).toMatchInlineSnapshot(`"hsla(0, 0%, 91%, 1)"`);
  expect(darken('white', 0.2)).toMatchInlineSnapshot(`"hsla(0, 0%, 82%, 1)"`);
  expect(darken('white', 0.3)).toMatchInlineSnapshot(`"hsla(0, 0%, 72%, 1)"`);
  expect(darken('white', 0.4)).toMatchInlineSnapshot(`"hsla(0, 0%, 63%, 1)"`);
  expect(darken('white', 0.5)).toMatchInlineSnapshot(`"hsla(0, 0%, 53%, 1)"`);
  expect(darken('white', 0.6)).toMatchInlineSnapshot(`"hsla(0, 0%, 43%, 1)"`);
  expect(darken('white', 0.7)).toMatchInlineSnapshot(`"hsla(0, 0%, 33%, 1)"`);
  expect(darken('white', 0.8)).toMatchInlineSnapshot(`"hsla(0, 0%, 22%, 1)"`);
  expect(darken('white', 0.9)).toMatchInlineSnapshot(`"hsla(0, 0%, 9%, 1)"`);
  expect(darken('white', 1)).toMatchInlineSnapshot(`"#000"`);
});

test('lighten black', () => {
  expect(darken('black', -0.1)).toMatchInlineSnapshot(`"hsla(0, 0%, 10%, 1)"`);
  expect(darken('black', -0.2)).toMatchInlineSnapshot(`"hsla(0, 0%, 23%, 1)"`);
  expect(darken('black', -0.3)).toMatchInlineSnapshot(`"hsla(0, 0%, 34%, 1)"`);
  expect(darken('black', -0.4)).toMatchInlineSnapshot(`"hsla(0, 0%, 44%, 1)"`);
  expect(darken('black', -0.5)).toMatchInlineSnapshot(`"hsla(0, 0%, 54%, 1)"`);
  expect(darken('black', -0.6)).toMatchInlineSnapshot(`"hsla(0, 0%, 64%, 1)"`);
  expect(darken('black', -0.7)).toMatchInlineSnapshot(`"hsla(0, 0%, 73%, 1)"`);
  expect(darken('black', -0.8)).toMatchInlineSnapshot(`"hsla(0, 0%, 83%, 1)"`);
  expect(darken('black', -0.9)).toMatchInlineSnapshot(`"hsla(0, 0%, 92%, 1)"`);
  expect(darken('black', -1)).toMatchInlineSnapshot(`"#fff"`);
});
