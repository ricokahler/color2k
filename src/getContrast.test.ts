// taken from:
// https://github.com/styled-components/polished/blob/0764c982551b487469043acb56281b0358b3107b/src/color/test/contrast.test.js
import getContrast from './getContrast';

it('should return the color contrast of two hex colors', () => {
  expect(getContrast('#444', '#fff')).toMatchInlineSnapshot(`9.72`);
});

it('should return the color contrast of two 8-digit hex colors', () => {
  expect(getContrast('#6564CDB3', '#ffffff')).toMatchInlineSnapshot(`4.93`);
});

it('should return the color contrast of two 4-digit hex colors', () => {
  expect(getContrast('#0f08', '#000')).toMatchInlineSnapshot(`15.3`);
});

it('should return the color contrast of two rgba colors', () => {
  expect(
    getContrast('rgba(101,100,205,0.7)', 'rgba(0,0,0,1)')
  ).toMatchInlineSnapshot(`4.26`);
});

it('should return the color contrast of two rgb colors', () => {
  expect(getContrast('rgb(204,205,100)', 'rgb(0,0,0)')).toMatchInlineSnapshot(
    `12.48`
  );
});

it('should return the color contrast of two hsla colors', () => {
  expect(
    getContrast('hsla(250, 100%, 50%, 0.2)', 'hsla(0, 100%, 100%, 1)')
  ).toMatchInlineSnapshot(`8.27`);
});

it('should return the color contrast of two hsl colors', () => {
  expect(
    getContrast('hsl(0, 100%, 50%)', 'hsl(0, 100%, 100%)')
  ).toMatchInlineSnapshot(`3.99`);
});

it('should return the color contrast of two named CSS colors', () => {
  expect(getContrast('papayawhip', 'white')).toMatchInlineSnapshot(`1.13`);
});

it('should return 1 when used with a transparent color', () => {
  expect(getContrast('transparent', '#000')).toMatchInlineSnapshot(`1`);
});
