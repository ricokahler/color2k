import opacify from './opacify';

it('works', () => {
  expect(opacify('rgba(255, 255, 255, 0.5)', 0.1)).toMatchInlineSnapshot(
    `"rgba(255, 255, 255, 0.6)"`
  );
});
