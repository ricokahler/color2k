import hasBadContrast from './hasBadContrast';

test('blue', () => {
  // blue should be fine for all of these
  expect(hasBadContrast('blue', 'decorative')).toBe(false);
  expect(hasBadContrast('blue', 'readable')).toBe(false);
  expect(hasBadContrast('blue', 'aa')).toBe(false);
  expect(hasBadContrast('blue', 'aaa')).toBe(false);
});

test('red', () => {
  // these are good
  expect(hasBadContrast('red', 'decorative')).toBe(false);
  expect(hasBadContrast('red', 'readable')).toBe(false);
  // these are bad
  expect(hasBadContrast('red', 'aa')).toBe(true);
  expect(hasBadContrast('red', 'aaa')).toBe(true);
});
