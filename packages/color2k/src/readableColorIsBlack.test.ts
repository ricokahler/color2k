import readableColorIsBlack from './readableColorIsBlack';

test('contrastsWithWhite white', () => {
  expect(readableColorIsBlack('white')).toBe(true);
});

test('contrastsWithWhite black', () => {
  expect(readableColorIsBlack('black')).toBe(false);
});

test('contrastsWithWhite light gray', () => {
  expect(readableColorIsBlack('#eee')).toBe(true);
});

test('contrastsWithWhite dark gray', () => {
  expect(readableColorIsBlack('#111')).toBe(false);
});
