import contrastsWithWhite from './contrastsWithWhite';

test('contrastsWithWhite white', () => {
  expect(contrastsWithWhite('white')).toBe(false);
});

test('contrastsWithWhite black', () => {
  expect(contrastsWithWhite('black')).toBe(true);
});

test('contrastsWithWhite light gray', () => {
  expect(contrastsWithWhite('#eee')).toBe(false);
});

test('contrastsWithWhite dark gray', () => {
  expect(contrastsWithWhite('#111')).toBe(true);
});
