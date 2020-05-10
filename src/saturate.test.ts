import saturate from './saturate';

test('red 50%', () => {
  expect(saturate('hsl(0, 50%, 50%)', 0.1)).toMatchInlineSnapshot(
    `"hsla(0, 60%, 50%, 1)"`
  );
});
