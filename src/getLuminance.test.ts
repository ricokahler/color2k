// taken from:
// https://github.com/styled-components/polished/blob/0764c982551b487469043acb56281b0358b3107b/src/color/test/luminance.test.js
import getLuminance from './getLuminance';

it('should return the luminance of a hex color', () => {
  expect(getLuminance('#444')).toMatchInlineSnapshot(`0.058`);
});

it('should return the luminance of an 8-digit hex color', () => {
  expect(getLuminance('#6564CDB3')).toMatchInlineSnapshot(`0.163`);
});

it('should return the luminance of an 4-digit hex color', () => {
  expect(getLuminance('#0f08')).toMatchInlineSnapshot(`0.715`);
});

it('should return the luminance of an rgba color', () => {
  expect(getLuminance('rgba(101,100,205,0.7)')).toMatchInlineSnapshot(`0.163`);
});

it('should return the luminance of an rgb color', () => {
  expect(getLuminance('rgb(204,205,100)')).toMatchInlineSnapshot(`0.574`);
});

it('should return the luminance of an hlsa color', () => {
  expect(getLuminance('hsla(250, 100%, 50%, 0.2)')).toMatchInlineSnapshot(
    `0.077`
  );
});

it('should return the luminance of an hls color', () => {
  expect(getLuminance('hsl(0, 100%, 50%)')).toMatchInlineSnapshot(`0.213`);
});

it('should return the luminance of a named CSS color', () => {
  expect(getLuminance('papayawhip')).toMatchInlineSnapshot(`0.878`);
});

it('should return 0 when passed transparent', () => {
  expect(getLuminance('transparent')).toMatchInlineSnapshot(`0`);
});
