import readableColor from './readableColor';

it('readableColor white', () => {
  expect(readableColor('white')).toMatchInlineSnapshot(`"#000"`);
});

it('readableColor black', () => {
  expect(readableColor('black')).toMatchInlineSnapshot(`"#fff"`);
});
