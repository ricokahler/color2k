import mix from './mix';

test('mix red with white', () => {
  expect(mix('red', 'white', 0.5)).toMatchInlineSnapshot(
    `"rgba(255, 128, 128, 1)"`
  );
});

test('mix with red with black', () => {
  expect(mix('red', 'black', 0.5)).toMatchInlineSnapshot(
    `"rgba(128, 0, 0, 1)"`
  );
});

test('mix red with blue', () => {
  expect(mix('red', 'blue', 0.5)).toMatchInlineSnapshot(
    `"rgba(128, 0, 128, 1)"`
  );
});

test('weight 100%', () => {
  expect(mix('red', 'blue', 1)).toMatchInlineSnapshot(`"rgba(0, 0, 255, 1)"`);
});

test('weight 0%', () => {
  expect(mix('red', 'blue', 0)).toMatchInlineSnapshot(`"rgba(255, 0, 0, 1)"`);
});

test('mix with transparent', () => {
  expect(mix('red', 'transparent', 0.5)).toMatchInlineSnapshot(
    `"rgba(255, 0, 0, 0.5)"`
  );
});

test('mix with transparent', () => {
  expect(mix('rgba(255, 0, 0, 0)', 'blue', 0.5)).toMatchInlineSnapshot(
    `"rgba(0, 0, 255, 0.5)"`
  );
});

test('mix blue and green', () => {
  expect(mix('blue', 'green', 0)).toMatchInlineSnapshot(`"rgba(0, 0, 255, 1)"`);
  expect(mix('blue', 'green', 0.25)).toMatchInlineSnapshot(
    `"rgba(0, 32, 191, 1)"`
  );
  expect(mix('blue', 'green', 0.5)).toMatchInlineSnapshot(
    `"rgba(0, 64, 128, 1)"`
  );
  expect(mix('blue', 'green', 0.75)).toMatchInlineSnapshot(
    `"rgba(0, 96, 64, 1)"`
  );
  expect(mix('blue', 'green', 1)).toMatchInlineSnapshot(`"rgba(0, 128, 0, 1)"`);
});

test('mix with transparent and weight 0%', () => {
  expect(mix('transparent', 'blue', 0)).toMatchInlineSnapshot(
    `"rgba(0, 0, 0, 0)"`
  );
});

test('mix with transparent and weight 100%', () => {
    `"rgba(255, 0, 0, 0)"`
  expect(mix('red', 'rgba(255, 0, 0, 0)', 1)).toMatchInlineSnapshot(
  );
});
