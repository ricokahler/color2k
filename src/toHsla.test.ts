import toHsla from './toHsla';

it('takes in any color and outputs it as rbga', () => {
  expect(toHsla('peachpuff')).toMatchInlineSnapshot(`"hsla(28, 100%, 86%, 1)"`);
});

test('hex w/ transparency', () => {
  expect(toHsla('#00ff0080')).toMatchInlineSnapshot(
    `"hsla(120, 100%, 50%, 0.502)"`
  );
});

test('hsla w/ transparency', () => {
  expect(toHsla('rgba(0, 255, 0, 0.5)')).toMatchInlineSnapshot(
    `"hsla(120, 100%, 50%, 0.5)"`
  );
});
