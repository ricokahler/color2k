import lightnessDarken from './lightnessDarken';

test('darken white', () => {
  expect(lightnessDarken('white', 0.1)).toMatchInlineSnapshot(
    `"hsla(0, 0%, 90%, 1)"`
  );
});

test('darken black (no-op)', () => {
  expect(lightnessDarken('black', 0.1)).toMatchInlineSnapshot(
    `"hsla(0, 0%, 0%, 1)"`
  );
});

test('negative darken (lighten)', () => {
  expect(lightnessDarken('black', -0.1)).toMatchInlineSnapshot(
    `"hsla(0, 0%, 10%, 1)"`
  );
});
