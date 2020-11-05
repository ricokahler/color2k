import ColorError from './ColorError';

it('is an instance of error', () => {
  const colorError = new ColorError('test');
  expect(colorError instanceof Error).toBe(true);
});

it('can be used with instanceof', () => {
  const colorError = new ColorError('test');
  expect(colorError instanceof ColorError).toBe(true);
});
