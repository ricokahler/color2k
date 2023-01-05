import fs from 'fs';
import path from 'path';
import getDocInfo, { DocInfo } from './getDocInfo';

test('test', async () => {
  const buffer = await fs.promises.readFile(
    require.resolve('../src/transparentize')
  );
  const code = buffer.toString();

  expect(getDocInfo(code)).toMatchInlineSnapshot(`
    {
      "description": "<p>Takes in a color and makes it more transparent by convert to <code>rgba</code> and
    decreasing the amount in the alpha channel.</p>",
      "functionName": "transparentize",
      "id": "transparentize",
      "params": [
        {
          "name": "color",
          "type": "string",
        },
        {
          "description": "The amount to increase the transparency by, given as a decimal between 0 and 1",
          "name": "amount",
          "type": "number",
        },
      ],
      "returnType": "string",
    }
  `);
});

test('all of them', async () => {
  const functionFiles = (
    await fs.promises.readdir(path.resolve(__dirname, '../src'))
  ).filter(
    (filename) =>
      !filename.endsWith('.test.ts') &&
      filename !== 'index.ts' &&
      filename !== 'ColorError.ts'
  );

  const docs: DocInfo[] = [];
  for (const file of functionFiles) {
    try {
      const buffer = await fs.promises.readFile(
        path.resolve(__dirname, `../src/${file}`)
      );
      const contents = buffer.toString();
      docs.push(getDocInfo(contents));
    } catch (e) {
      console.warn(`Failed to create doc for ${file}. ${e.message}`);
    }
  }

  expect(docs).toMatchInlineSnapshot(`
    [
      {
        "description": "<p>Adjusts the current hue of the color by the given degrees. Wraps around when
    over 360.</p>",
        "functionName": "adjustHue",
        "id": "adjust-hue",
        "params": [
          {
            "description": "input color",
            "name": "color",
            "type": "string",
          },
          {
            "description": "degrees to adjust the input color, accepts degree integers  (0 - 360) and wraps around on overflow",
            "name": "degrees",
            "type": "number",
          },
        ],
        "returnType": "string",
      },
      {
        "description": "<p>Darkens using lightness. This is equivalent to subtracting the lightness
    from the L in HSL.</p>",
        "functionName": "darken",
        "id": "darken",
        "params": [
          {
            "name": "color",
            "type": "string",
          },
          {
            "description": "The amount to darken, given as a decimal between 0 and 1",
            "name": "amount",
            "type": "number",
          },
        ],
        "returnType": "string",
      },
      {
        "description": "<p>Desaturates the input color by the given amount via subtracting from the <code>s</code>
    in <code>hsla</code>.</p>",
        "functionName": "desaturate",
        "id": "desaturate",
        "params": [
          {
            "name": "color",
            "type": "string",
          },
          {
            "description": "The amount to desaturate, given as a decimal between 0 and 1",
            "name": "amount",
            "type": "number",
          },
        ],
        "returnType": "string",
      },
      {
        "description": "<p>Returns the contrast ratio between two colors based on
    <a href="http://www.w3.org/TR/WCAG20/#contrast-ratiodef">W3's recommended equation for calculating contrast</a>.</p>",
        "functionName": "getContrast",
        "id": "get-contrast",
        "params": [
          {
            "name": "color1",
            "type": "string",
          },
          {
            "name": "color2",
            "type": "string",
          },
        ],
        "returnType": "number",
      },
      {
        "description": "<p>Returns a number (float) representing the luminance of a color.</p>",
        "functionName": "getLuminance",
        "id": "get-luminance",
        "params": [
          {
            "name": "color",
            "type": "string",
          },
        ],
        "returnType": "number",
      },
      {
        "description": "<p>Given a series colors, this function will return a <code>scale(x)</code> function that
    accepts a percentage as a decimal between 0 and 1 and returns the color at
    that percentage in the scale.</p>
    <pre><code class="js language-js">const scale = getScale('red', 'yellow', 'green');
    console.log(scale(0)); // rgba(255, 0, 0, 1)
    console.log(scale(0.5)); // rgba(255, 255, 0, 1)
    console.log(scale(1)); // rgba(0, 128, 0, 1)
    </code></pre>
    <p>If you'd like to limit the domain and range like chroma-js, we recommend
    wrapping scale again.</p>
    <pre><code class="js language-js">const _scale = getScale('red', 'yellow', 'green');
    const scale = x =&gt; _scale(x / 100);

    console.log(scale(0)); // rgba(255, 0, 0, 1)
    console.log(scale(50)); // rgba(255, 255, 0, 1)
    console.log(scale(100)); // rgba(0, 128, 0, 1)
    </code></pre>",
        "functionName": "getScale",
        "id": "get-scale",
        "params": [
          {
            "name": "colors",
            "type": "string[]",
          },
        ],
        "returnType": "(n: number) => string",
      },
      {
        "description": "<p>A simple guard function:</p>
    <pre><code class="js language-js">Math.min(Math.max(low, value), high)
    </code></pre>",
        "functionName": "guard",
        "id": "guard",
        "params": [
          {
            "name": "low",
            "type": "number",
          },
          {
            "name": "high",
            "type": "number",
          },
          {
            "name": "value",
            "type": "number",
          },
        ],
        "returnType": "number",
      },
      {
        "description": "<p>Returns whether or not a color has bad contrast against a background
    according to a given standard.</p>",
        "functionName": "hasBadContrast",
        "id": "has-bad-contrast",
        "params": [
          {
            "name": "color",
            "type": "string",
          },
          {
            "name": "standard",
            "type": "'decorative' | 'readable' | 'aa' | 'aaa' = 'aa'",
          },
          {
            "name": "background",
            "type": "string = '#fff'",
          },
        ],
        "returnType": "boolean",
      },
      {
        "description": "<p>Takes in hsla parts and constructs an hsla string</p>",
        "functionName": "hsla",
        "id": "hsla",
        "params": [
          {
            "description": "The color circle (from 0 to 360) - 0 (or 360) is red, 120 is green, 240 is blue",
            "name": "hue",
            "type": "number",
          },
          {
            "description": "Percentage of saturation, given as a decimal between 0 and 1",
            "name": "saturation",
            "type": "number",
          },
          {
            "description": "Percentage of lightness, given as a decimal between 0 and 1",
            "name": "lightness",
            "type": "number",
          },
          {
            "description": "Percentage of opacity, given as a decimal between 0 and 1",
            "name": "alpha",
            "type": "number",
          },
        ],
        "returnType": "string",
      },
      {
        "description": "<p>Lightens a color by a given amount. This is equivalent to
    <code>darken(color, -amount)</code></p>",
        "functionName": "lighten",
        "id": "lighten",
        "params": [
          {
            "name": "color",
            "type": "string",
          },
          {
            "description": "The amount to darken, given as a decimal between 0 and 1",
            "name": "amount",
            "type": "number",
          },
        ],
        "returnType": "string",
      },
      {
        "description": "<p>Mixes two colors together. Taken from sass's implementation.</p>",
        "functionName": "mix",
        "id": "mix",
        "params": [
          {
            "name": "color1",
            "type": "string",
          },
          {
            "name": "color2",
            "type": "string",
          },
          {
            "name": "weight",
            "type": "number",
          },
        ],
        "returnType": "string",
      },
      {
        "description": "<p>Takes a color and un-transparentizes it. Equivalent to
    <code>transparentize(color, -amount)</code></p>",
        "functionName": "opacify",
        "id": "opacify",
        "params": [
          {
            "name": "color",
            "type": "string",
          },
          {
            "description": "The amount to increase the opacity by, given as a decimal between 0 and 1",
            "name": "amount",
            "type": "number",
          },
        ],
        "returnType": "string",
      },
      {
        "description": "<p>Parses a color in hue, saturation, lightness, and the alpha channel.</p>
    <p>Hue is a number between 0 and 360, saturation, lightness, and alpha are
    decimal percentages between 0 and 1</p>",
        "functionName": "parseToHsla",
        "id": "parse-to-hsla",
        "params": [
          {
            "name": "color",
            "type": "string",
          },
        ],
        "returnType": "[number, number, number, number]",
      },
      {
        "description": "<p>Parses a color into red, gree, blue, alpha parts</p>",
        "functionName": "parseToRgba",
        "id": "parse-to-rgba",
        "params": [
          {
            "description": "the input color. Can be a RGB, RBGA, HSL, HSLA, or named color",
            "name": "color",
            "type": "string",
          },
        ],
        "returnType": "[number, number, number, number]",
      },
      {
        "description": "<p>Returns black or white for best contrast depending on the luminosity of the
    given color.</p>",
        "functionName": "readableColor",
        "id": "readable-color",
        "params": [
          {
            "name": "color",
            "type": "string",
          },
        ],
        "returnType": "string",
      },
      {
        "description": "<p>An alternative function to <code>readableColor</code>. Returns whether or not the 
    readable color (i.e. the color to be place on top the input color) should be
    black.</p>",
        "functionName": "readableColorIsBlack",
        "id": "readable-color-is-black",
        "params": [
          {
            "name": "color",
            "type": "string",
          },
        ],
        "returnType": "boolean",
      },
      {
        "description": "<p>Takes in rgba parts and returns an rgba string</p>",
        "functionName": "rgba",
        "id": "rgba",
        "params": [
          {
            "description": "The amount of red in the red channel, given in a number between 0 and 255 inclusive",
            "name": "red",
            "type": "number",
          },
          {
            "description": "The amount of green in the red channel, given in a number between 0 and 255 inclusive",
            "name": "green",
            "type": "number",
          },
          {
            "description": "The amount of blue in the red channel, given in a number between 0 and 255 inclusive",
            "name": "blue",
            "type": "number",
          },
          {
            "description": "Percentage of opacity, given as a decimal between 0 and 1",
            "name": "alpha",
            "type": "number",
          },
        ],
        "returnType": "string",
      },
      {
        "description": "<p>Saturates a color by converting it to <code>hsl</code> and increasing the saturation
    amount. Equivalent to <code>desaturate(color, -amount)</code></p>",
        "functionName": "saturate",
        "id": "saturate",
        "params": [
          {
            "description": "Input color",
            "name": "color",
            "type": "string",
          },
          {
            "description": "The amount to darken, given as a decimal between 0 and 1",
            "name": "amount",
            "type": "number",
          },
        ],
        "returnType": "string",
      },
      {
        "description": "<p>Takes in any color and returns it as a hex code.</p>",
        "functionName": "toHex",
        "id": "to-hex",
        "params": [
          {
            "name": "color",
            "type": "string",
          },
        ],
        "returnType": "string",
      },
      {
        "description": "<p>Takes in any color and returns it as an hsla string.</p>",
        "functionName": "toHsla",
        "id": "to-hsla",
        "params": [
          {
            "name": "color",
            "type": "string",
          },
        ],
        "returnType": "string",
      },
      {
        "description": "<p>Takes in any color and returns it as an rgba string.</p>",
        "functionName": "toRgba",
        "id": "to-rgba",
        "params": [
          {
            "name": "color",
            "type": "string",
          },
        ],
        "returnType": "string",
      },
      {
        "description": "<p>Takes in a color and makes it more transparent by convert to <code>rgba</code> and
    decreasing the amount in the alpha channel.</p>",
        "functionName": "transparentize",
        "id": "transparentize",
        "params": [
          {
            "name": "color",
            "type": "string",
          },
          {
            "description": "The amount to increase the transparency by, given as a decimal between 0 and 1",
            "name": "amount",
            "type": "number",
          },
        ],
        "returnType": "string",
      },
    ]
  `);
});
