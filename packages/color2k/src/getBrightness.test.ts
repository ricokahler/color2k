import getBrightness from './getBrightness';

test('white', () => {
  expect(getBrightness('white')).toMatchInlineSnapshot(`1`);
});

test('light gray', () => {
  expect(getBrightness('#eee')).toMatchInlineSnapshot(`0.9246581033680686`);
});

test('dark gray', () => {
  expect(getBrightness('#111')).toMatchInlineSnapshot(`0.07486916337319874`);
});

test('black', () => {
  expect(getBrightness('black')).toMatchInlineSnapshot(`0`);
});
