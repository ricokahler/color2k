import getBrightness from './getBrightness';

test('white', () => {
  expect(getBrightness('white')).toMatchInlineSnapshot(`1`);
});

test('light gray', () => {
  expect(getBrightness('#eee')).toMatchInlineSnapshot(`0.9246621004453465`);
});

test('dark gray', () => {
  expect(getBrightness('#111')).toMatchInlineSnapshot(`0.07745966692414834`);
});

test('black', () => {
  expect(getBrightness('black')).toMatchInlineSnapshot(`0`);
});
