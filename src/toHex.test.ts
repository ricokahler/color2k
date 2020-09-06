import toHex from './toHex';

it("takes in any color and returns it's hex code", () => {
  expect(toHex('palevioletred')).toMatchInlineSnapshot(`"#db7093"`);
});

test('hex w/ transparency', () => {
  expect(toHex('#0000ff55')).toMatchInlineSnapshot(`"#0000ff55"`);
});

test('rgba no transparency', () => {
  expect(toHex('rgb(0, 175, 0)')).toMatchInlineSnapshot(`"#00af00"`);
});

test('hsla w/ transparency', () => {
  expect(toHex('rgba(0, 255, 0, 0.5)')).toMatchInlineSnapshot(`"#00ff0080"`);
});
