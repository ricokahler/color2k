import guard from './guard';

test('0 1 2', () => {
  expect(guard(0, 1, 2)).toBe(1);
});

test('0 1 -2', () => {
  expect(guard(0, 1, -2)).toBe(0);
});

test('0 1 0.5', () => {
  expect(guard(0, 1, 0.5)).toBe(0.5);
});
