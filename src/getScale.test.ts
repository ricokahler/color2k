import getScale from './getScale';

test('red, green, blue', () => {
  const scale = getScale('red', 'yellow', 'green');

  expect(scale(0)).toMatchInlineSnapshot(`"rgba(255, 0, 0, 1)"`);
  expect(scale(0.1)).toMatchInlineSnapshot(`"rgba(255, 51, 0, 1)"`);
  expect(scale(0.2)).toMatchInlineSnapshot(`"rgba(255, 102, 0, 1)"`);
  expect(scale(0.3)).toMatchInlineSnapshot(`"rgba(255, 153, 0, 1)"`);
  expect(scale(0.4)).toMatchInlineSnapshot(`"rgba(255, 204, 0, 1)"`);
  expect(scale(0.5)).toMatchInlineSnapshot(`"rgba(255, 255, 0, 1)"`);
  expect(scale(0.6)).toMatchInlineSnapshot(`"rgba(204, 230, 0, 1)"`);
  expect(scale(0.7)).toMatchInlineSnapshot(`"rgba(153, 204, 0, 1)"`);
  expect(scale(0.8)).toMatchInlineSnapshot(`"rgba(102, 179, 0, 1)"`);
  expect(scale(0.9)).toMatchInlineSnapshot(`"rgba(51, 153, 0, 1)"`);
  expect(scale(1)).toMatchInlineSnapshot(`"rgba(0, 128, 0, 1)"`);
});

test('white, black', () => {
  const scale = getScale('white', 'black');

  expect(scale(0)).toMatchInlineSnapshot(`"rgba(255, 255, 255, 1)"`);
  expect(scale(0.1)).toMatchInlineSnapshot(`"rgba(230, 230, 230, 1)"`);
  expect(scale(0.2)).toMatchInlineSnapshot(`"rgba(204, 204, 204, 1)"`);
  expect(scale(0.3)).toMatchInlineSnapshot(`"rgba(179, 179, 179, 1)"`);
  expect(scale(0.4)).toMatchInlineSnapshot(`"rgba(153, 153, 153, 1)"`);
  expect(scale(0.5)).toMatchInlineSnapshot(`"rgba(128, 128, 128, 1)"`);
  expect(scale(0.6)).toMatchInlineSnapshot(`"rgba(102, 102, 102, 1)"`);
  expect(scale(0.7)).toMatchInlineSnapshot(`"rgba(77, 77, 77, 1)"`);
  expect(scale(0.8)).toMatchInlineSnapshot(`"rgba(51, 51, 51, 1)"`);
  expect(scale(0.9)).toMatchInlineSnapshot(`"rgba(25, 25, 25, 1)"`);
  expect(scale(1)).toMatchInlineSnapshot(`"rgba(0, 0, 0, 1)"`);
});

test('yellow, red, black', () => {
  const scale = getScale('yellow', 'red', 'black');

  expect(scale(0)).toMatchInlineSnapshot(`"rgba(255, 255, 0, 1)"`);
  expect(scale(0.1)).toMatchInlineSnapshot(`"rgba(255, 204, 0, 1)"`);
  expect(scale(0.2)).toMatchInlineSnapshot(`"rgba(255, 153, 0, 1)"`);
  expect(scale(0.3)).toMatchInlineSnapshot(`"rgba(255, 102, 0, 1)"`);
  expect(scale(0.4)).toMatchInlineSnapshot(`"rgba(255, 51, 0, 1)"`);
  expect(scale(0.5)).toMatchInlineSnapshot(`"rgba(255, 0, 0, 1)"`);
  expect(scale(0.6)).toMatchInlineSnapshot(`"rgba(204, 0, 0, 1)"`);
  expect(scale(0.7)).toMatchInlineSnapshot(`"rgba(153, 0, 0, 1)"`);
  expect(scale(0.8)).toMatchInlineSnapshot(`"rgba(102, 0, 0, 1)"`);
  expect(scale(0.9)).toMatchInlineSnapshot(`"rgba(51, 0, 0, 1)"`);
  expect(scale(1)).toMatchInlineSnapshot(`"rgba(0, 0, 0, 1)"`);
});

test('yellow, red, black', () => {
  const scale = getScale('yellow', 'red', 'black');

  expect(scale(0)).toMatchInlineSnapshot(`"rgba(255, 255, 0, 1)"`);
  expect(scale(0.1)).toMatchInlineSnapshot(`"rgba(255, 204, 0, 1)"`);
  expect(scale(0.2)).toMatchInlineSnapshot(`"rgba(255, 153, 0, 1)"`);
  expect(scale(0.3)).toMatchInlineSnapshot(`"rgba(255, 102, 0, 1)"`);
  expect(scale(0.4)).toMatchInlineSnapshot(`"rgba(255, 51, 0, 1)"`);
  expect(scale(0.5)).toMatchInlineSnapshot(`"rgba(255, 0, 0, 1)"`);
  expect(scale(0.6)).toMatchInlineSnapshot(`"rgba(204, 0, 0, 1)"`);
  expect(scale(0.7)).toMatchInlineSnapshot(`"rgba(153, 0, 0, 1)"`);
  expect(scale(0.8)).toMatchInlineSnapshot(`"rgba(102, 0, 0, 1)"`);
  expect(scale(0.9)).toMatchInlineSnapshot(`"rgba(51, 0, 0, 1)"`);
  expect(scale(1)).toMatchInlineSnapshot(`"rgba(0, 0, 0, 1)"`);
});

test('large example', () => {
  const scale = getScale(
    '#AA0000',
    '#D00000',
    '#F70000',
    '#FF1D00',
    '#FF4400',
    '#FF6A00',
    '#FF9000',
    '#FFB700',
    '#FFDD00',
    '#FFFF00',
    '#FFFF00',
    '#FFFF00',
    '#BDFF0C',
    '#73FF1A',
    '#3FFA36',
    '#16F45A',
    '#00D08B',
    '#0087CD',
    '#0048FA',
    '#0024E3'
  );

  expect(scale(0)).toMatchInlineSnapshot(`"rgba(170, 0, 0, 1)"`);
  expect(scale(0.05)).toMatchInlineSnapshot(`"rgba(206, 0, 0, 1)"`);
  expect(scale(0.1)).toMatchInlineSnapshot(`"rgba(243, 0, 0, 1)"`);
  expect(scale(0.15)).toMatchInlineSnapshot(`"rgba(254, 25, 0, 1)"`);
  expect(scale(0.2)).toMatchInlineSnapshot(`"rgba(255, 60, 0, 1)"`);
  expect(scale(0.25)).toMatchInlineSnapshot(`"rgba(255, 97, 0, 1)"`);
  expect(scale(0.3)).toMatchInlineSnapshot(`"rgba(255, 133, 0, 1)"`);
  expect(scale(0.35)).toMatchInlineSnapshot(`"rgba(255, 169, 0, 1)"`);
  expect(scale(0.4)).toMatchInlineSnapshot(`"rgba(255, 206, 0, 1)"`);
  expect(scale(0.45)).toMatchInlineSnapshot(`"rgba(255, 240, 0, 1)"`);
  expect(scale(0.5)).toMatchInlineSnapshot(`"rgba(255, 255, 0, 1)"`);
});

test('out of bounds', () => {
  const scale = getScale('white', 'black');

  expect(scale(-1)).toMatchInlineSnapshot(`"rgba(255, 255, 255, 1)"`);
  expect(scale(100)).toMatchInlineSnapshot(`"rgba(0, 0, 0, 1)"`);
});
