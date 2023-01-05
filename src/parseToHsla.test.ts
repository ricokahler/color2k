import parseToHsla from './parseToHsla';

test('white', () => {
  expect(parseToHsla('white')).toMatchInlineSnapshot(`
    [
      0,
      0,
      1,
      1,
    ]
  `);
});

test('black', () => {
  expect(parseToHsla('black')).toMatchInlineSnapshot(`
    [
      0,
      0,
      0,
      1,
    ]
  `);
});

test('red', () => {
  expect(parseToHsla('red')).toMatchInlineSnapshot(`
    [
      0,
      1,
      0.5,
      1,
    ]
  `);
});

test('with alpha', () => {
  expect(parseToHsla('rgba(255, 255, 255, 0.5)')).toMatchInlineSnapshot(`
    [
      0,
      0,
      1,
      0.5,
    ]
  `);
});
