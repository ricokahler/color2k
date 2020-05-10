import transparentize from './transparentize';

it('works', () => {
  expect(transparentize('white', 0.1)).toMatchInlineSnapshot(
    `"rgba(255, 255, 255, 0.9)"`
  );
});

test('existing transparency', () => {
  expect(transparentize('rgba(255, 255, 255, 0.9)', 0.1)).toMatchInlineSnapshot(
    `"rgba(255, 255, 255, 0.8)"`
  );
});

test('complete transparency', () => {
  expect(transparentize('rgba(255, 255, 255, 0)', 0.1)).toMatchInlineSnapshot(
    `"rgba(0, 0, 0, 0)"`
  );
});
