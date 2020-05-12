import vary from './vary';
import { darken, adjustHue, mix } from './';

test('works', () => {
  const result = vary('red', [
    [darken, 0.1],
    [adjustHue, 180],
    [mix, 'white', 0.3],
  ]);

  expect(result).toMatchInlineSnapshot(`"rgba(77, 219, 219, 1)"`);
});
