import parseToHsla from './parseToHsla';

test('white', () => {
  expect(parseToHsla('white')).toMatchInlineSnapshot(`
    Array [
      0,
      0,
      1,
      1,
    ]
  `);
});

test('black', () => {
  expect(parseToHsla('black')).toMatchInlineSnapshot(`
    Array [
      0,
      0,
      0,
      1,
    ]
  `);
});

test('red', () => {
  expect(parseToHsla('red')).toMatchInlineSnapshot(`
    Array [
      0,
      1,
      0.5,
      1,
    ]
  `);
});

test('with alpha', () => {
  expect(parseToHsla('rgba(255, 255, 255, 0.5)')).toMatchInlineSnapshot(`
    Array [
      0,
      0,
      1,
      0.5,
    ]
  `);
});
