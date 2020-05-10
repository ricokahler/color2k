import parseToRgba from './';
import playwright, { Page, Browser } from 'playwright';
// @ts-ignore
import rollupConfig from '../../../rollup.config';
const rollup = require('rollup');

let script: string;

beforeAll(async () => {
  const [umdConfig] = rollupConfig;
  const build = await rollup.rollup(umdConfig);
  const { output } = await build.generate(umdConfig.output);
  expect(output.length).toBe(1);
  const [chunk] = output;
  const { code } = chunk;
  script = code;
});

describe('node', () => {
  test('named colors', () => {
    expect(parseToRgba('red')).toEqual([255, 0, 0, 1]);
  });

  test('hex', () => {
    expect(parseToRgba('#00f')).toEqual([0, 0, 255, 1]);
  });

  test('hex w/ alpha', () => {
    expect(parseToRgba('#0000ffaa')).toEqual([0, 0, 255, 2 / 3]);
  });

  test('hsl', () => {
    expect(parseToRgba('hsl(0, 50%, 50%)')).toEqual([191, 64, 64, 1]);
  });

  test('hsl white', () => {
    expect(parseToRgba('hsl(0, 0%, 100%)')).toEqual([255, 255, 255, 1]);
  });

  test('rgba', () => {
    expect(parseToRgba('rgba(255, 255, 255, 0.5)')).toEqual([
      255,
      255,
      255,
      0.5,
    ]);
  });

  test('rgba full transparent', () => {
    expect(parseToRgba('rgba(255, 255, 255, 0)')).toEqual([0, 0, 0, 0]);
  });

  test('hsla full transparent', () => {
    expect(parseToRgba('hsla(0, 100%, 100%, 0)')).toEqual([0, 0, 0, 0]);
  });

  test('transparent', () => {
    expect(parseToRgba('transparent')).toEqual([0, 0, 0, 0]);
  });

  test('invalid color', () => {
    expect(() => {
      parseToRgba('not real');
    }).toThrowErrorMatchingInlineSnapshot(
      `"Failed to parse color: \\"not real\\""`
    );
  });
});

const browserTypes = [
  'chromium' as 'chromium',
  'firefox' as 'firefox',
  'webkit' as 'webkit',
];

for (const browserType of browserTypes) {
  // eslint-disable-next-line no-loop-func
  describe(browserType, () => {
    let page: Page;
    let browser: Browser;

    beforeEach(async () => {
      browser = await playwright[browserType].launch();
      const context = await browser.newContext();
      page = await context.newPage();
      await page.evaluate(script);
    });

    afterEach(async () => {
      await browser.close();
    });

    test('named colors', async () => {
      const result = await page.evaluate("parseToRgba('red')");
      expect(result).toEqual([255, 0, 0, 1]);
    });

    test('hex', async () => {
      const result = await page.evaluate("parseToRgba('#00f')");
      expect(result).toEqual([0, 0, 255, 1]);
    });

    test('hex w/ alpha', async () => {
      const result = await page.evaluate("parseToRgba('#0000ffaa')");
      expect(result).toEqual([0, 0, 255, 2 / 3]);
    });

    test('hsl', async () => {
      const result = await page.evaluate("parseToRgba('hsl(0, 50%, 50%)')");
      expect(result).toEqual([191, 64, 64, 1]);
    });

    test('hsl white', async () => {
      const result = await page.evaluate("parseToRgba('hsl(0, 0%, 100%)')");
      expect(result).toEqual([255, 255, 255, 1]);
    });

    test('rgba', async () => {
      const result = await page.evaluate(
        "parseToRgba('rgba(255, 255, 255, 0.5)')"
      );
      expect(result).toEqual([255, 255, 255, 128 / 255]);
    });

    test('rgba full transparent', async () => {
      const result = await page.evaluate(
        "parseToRgba('rgba(255, 255, 230, 0)')"
      );
      expect(result).toEqual([0, 0, 0, 0]);
    });

    test('hsla full transparent', async () => {
      const result = await page.evaluate(
        "parseToRgba('hsla(0, 100%, 100%, 0)')"
      );
      expect(result).toEqual([0, 0, 0, 0]);
    });

    test('transparent', async () => {
      const result = await page.evaluate("parseToRgba('transparent')");
      expect(result).toEqual([0, 0, 0, 0]);
    });

    test('invalid color', async () => {
      let caught = false;
      try {
        await page.evaluate("parseToRgba('not real')");
      } catch {
        // the error messages differen from browser to browser so this will
        // have to do
        caught = true;
      }

      expect(caught).toBe(true);
    });
  });
}
