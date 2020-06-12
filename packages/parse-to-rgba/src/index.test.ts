import parseToRgba from './';
import playwright, { Page, Browser } from 'playwright';
import { JSDOM, DOMWindow } from 'jsdom';
// @ts-ignore
import rollupConfig from '../../../rollup.config';
const rollup = require('rollup');

/** this is color2k as a UMD string build */
let script: string;
/** this is color2kCompat as a UMD string build */
let compatScript: string;

beforeAll(async () => {
  await (async () => {
    const [umdConfig] = rollupConfig;
    const build = await rollup.rollup(umdConfig);
    const { output } = await build.generate(umdConfig.output);
    expect(output.length).toBe(1);
    const [chunk] = output;
    const { code } = chunk;
    script = code;
  })();

  await (async () => {
    const umdConfig = rollupConfig[2];
    const build = await rollup.rollup(umdConfig);
    const { output } = await build.generate(umdConfig.output);
    expect(output.length).toBe(1);
    const [chunk] = output;
    const { code } = chunk;
    compatScript = code;
  })();
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
    expect(parseToRgba('rgba(255, 255, 255, 0)')).toEqual([255, 255, 255, 0]);
  });

  test('hsla full transparent', () => {
    expect(parseToRgba('hsla(0, 100%, 100%, 0)')).toEqual([255, 255, 255, 0]);
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

describe('jsdom', () => {
  let jsDomWindow: DOMWindow;

  beforeEach(() => {
    const jsdom = new JSDOM('', { runScripts: 'outside-only' });
    jsDomWindow = jsdom.window;
    jsDomWindow.eval(script);
    jsDomWindow.eval(compatScript);
  });

  test('named colors', () => {
    const result = jsDomWindow.eval("parseToRgba('red')");
    expect(result).toEqual([255, 0, 0, 1]);
  });

  test('hex', () => {
    const result = jsDomWindow.eval("parseToRgba('#00f')");
    expect(result).toEqual([0, 0, 255, 1]);
  });

  test('hex w/ alpha', () => {
    const result = jsDomWindow.eval("parseToRgba('#0000ffaa')");
    expect(result).toEqual([0, 0, 255, 2 / 3]);
  });

  test('hsl', () => {
    const result = jsDomWindow.eval("parseToRgba('hsl(0, 50%, 50%)')");
    expect(result).toEqual([191, 64, 64, 1]);
  });

  test('hsl white', () => {
    const result = jsDomWindow.eval("parseToRgba('hsl(0, 0%, 100%)')");
    expect(result).toEqual([255, 255, 255, 1]);
  });

  test('rgba', () => {
    const result = jsDomWindow.eval("parseToRgba('rgba(255, 255, 255, 0.5)')");
    expect(result).toEqual([255, 255, 255, 0.5]);
  });

  test('rgba full transparent', () => {
    const result = jsDomWindow.eval("parseToRgba('rgba(255, 255, 230, 0)')");
    expect(result).toEqual([255, 255, 230, 0]);
  });

  test('hsla full transparent', () => {
    const result = jsDomWindow.eval("parseToRgba('hsla(0, 100%, 100%, 0)')");
    expect(result).toEqual([255, 255, 255, 0]);
  });

  test('transparent', () => {
    const result = jsDomWindow.eval("parseToRgba('transparent')");
    expect(result).toEqual([0, 0, 0, 0]);
  });

  test('invalid color', () => {
    let caught = false;
    try {
      jsDomWindow.eval("parseToRgba('not real')");
    } catch {
      caught = true;
    }

    expect(caught).toBe(true);
  });
});

const browserTypes =
  // only run in CI
  process.env.CI === 'true' || process.env.TEST_BROWSER === 'true'
    ? ['chromium' as 'chromium', 'firefox' as 'firefox', 'webkit' as 'webkit']
    : [];

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
      expect(result).toEqual([0, 0, 255, 0.667]);
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
      expect(result).toEqual([255, 255, 255, 0.5]);
    });

    test('rgba full transparent', async () => {
      const result = await page.evaluate(
        "parseToRgba('rgba(255, 255, 230, 0)')"
      );
      expect(result).toEqual([255, 255, 230, 0]);
    });

    test('hsla full transparent', async () => {
      const result = await page.evaluate(
        "parseToRgba('hsla(0, 100%, 100%, 0)')"
      );
      expect(result).toEqual([255, 255, 255, 0]);
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
        caught = true;
      }

      expect(caught).toBe(true);
    });
  });
}
