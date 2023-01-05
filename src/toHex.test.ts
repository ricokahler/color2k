import toHex from './toHex';
import darken from './darken';

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

test('https://github.com/ricokahler/color2k/issues/235', () => {
  expect(darken('#b00020', 0.2)).toMatchInlineSnapshot(
    `"hsla(349, 100%, 15%, 1)"`
  );
  expect(toHex(darken('#b00020', 0.2))).toMatchInlineSnapshot(`"#4d000e"`);

  expect(toHex('#03dac5')).toMatchInlineSnapshot(`"#03dac5"`);
});

test('https://github.com/ricokahler/color2k/issues/463', () => {
  expect(toHex('hsla(15, 50%, 50%, 0)')).toMatchInlineSnapshot(`"#bf604000"`);
});
