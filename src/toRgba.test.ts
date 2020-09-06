import toRgba from './toRgba';

it('takes in any color and outputs it as rbga', () => {
  expect(toRgba('midnightblue')).toMatchInlineSnapshot(
    `"rgba(25, 25, 112, 1)"`
  );
});

test('hex w/ transparency', () => {
  expect(toRgba('#00ff0080')).toMatchInlineSnapshot(`"rgba(0, 255, 0, 0.502)"`);
});

test('hsla w/ transparency', () => {
  expect(toRgba('rgba(0, 255, 0, 0.5)')).toMatchInlineSnapshot(
    `"rgba(0, 255, 0, 0.5)"`
  );
});
