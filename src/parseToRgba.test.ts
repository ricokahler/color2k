import parseToRgba from './parseToRgba';

describe('parseToRgb', () => {
  it('works for all named colors', () => {
    const namedColorMap = {
      aliceblue: 'f0f8ff',
      antiquewhite: 'faebd7',
      aqua: '00ffff',
      aquamarine: '7fffd4',
      azure: 'f0ffff',
      beige: 'f5f5dc',
      bisque: 'ffe4c4',
      black: '000',
      blanchedalmond: 'ffebcd',
      blue: '0000ff',
      blueviolet: '8a2be2',
      brown: 'a52a2a',
      burlywood: 'deb887',
      cadetblue: '5f9ea0',
      chartreuse: '7fff00',
      chocolate: 'd2691e',
      coral: 'ff7f50',
      cornflowerblue: '6495ed',
      cornsilk: 'fff8dc',
      crimson: 'dc143c',
      cyan: '00ffff',
      darkblue: '00008b',
      darkcyan: '008b8b',
      darkgoldenrod: 'b8860b',
      darkgray: 'a9a9a9',
      darkgreen: '006400',
      darkgrey: 'a9a9a9',
      darkkhaki: 'bdb76b',
      darkmagenta: '8b008b',
      darkolivegreen: '556b2f',
      darkorange: 'ff8c00',
      darkorchid: '9932cc',
      darkred: '8b0000',
      darksalmon: 'e9967a',
      darkseagreen: '8fbc8f',
      darkslateblue: '483d8b',
      darkslategray: '2f4f4f',
      darkslategrey: '2f4f4f',
      darkturquoise: '00ced1',
      darkviolet: '9400d3',
      deeppink: 'ff1493',
      deepskyblue: '00bfff',
      dimgray: '696969',
      dimgrey: '696969',
      dodgerblue: '1e90ff',
      firebrick: 'b22222',
      floralwhite: 'fffaf0',
      forestgreen: '228b22',
      fuchsia: 'ff00ff',
      gainsboro: 'dcdcdc',
      ghostwhite: 'f8f8ff',
      gold: 'ffd700',
      goldenrod: 'daa520',
      gray: '808080',
      green: '008000',
      greenyellow: 'adff2f',
      grey: '808080',
      honeydew: 'f0fff0',
      hotpink: 'ff69b4',
      indianred: 'cd5c5c',
      indigo: '4b0082',
      ivory: 'fffff0',
      khaki: 'f0e68c',
      lavender: 'e6e6fa',
      lavenderblush: 'fff0f5',
      lawngreen: '7cfc00',
      lemonchiffon: 'fffacd',
      lightblue: 'add8e6',
      lightcoral: 'f08080',
      lightcyan: 'e0ffff',
      lightgoldenrodyellow: 'fafad2',
      lightgray: 'd3d3d3',
      lightgreen: '90ee90',
      lightgrey: 'd3d3d3',
      lightpink: 'ffb6c1',
      lightsalmon: 'ffa07a',
      lightseagreen: '20b2aa',
      lightskyblue: '87cefa',
      lightslategray: '789',
      lightslategrey: '789',
      lightsteelblue: 'b0c4de',
      lightyellow: 'ffffe0',
      lime: '0f0',
      limegreen: '32cd32',
      linen: 'faf0e6',
      magenta: 'f0f',
      maroon: '800000',
      mediumaquamarine: '66cdaa',
      mediumblue: '0000cd',
      mediumorchid: 'ba55d3',
      mediumpurple: '9370db',
      mediumseagreen: '3cb371',
      mediumslateblue: '7b68ee',
      mediumspringgreen: '00fa9a',
      mediumturquoise: '48d1cc',
      mediumvioletred: 'c71585',
      midnightblue: '191970',
      mintcream: 'f5fffa',
      mistyrose: 'ffe4e1',
      moccasin: 'ffe4b5',
      navajowhite: 'ffdead',
      navy: '000080',
      oldlace: 'fdf5e6',
      olive: '808000',
      olivedrab: '6b8e23',
      orange: 'ffa500',
      orangered: 'ff4500',
      orchid: 'da70d6',
      palegoldenrod: 'eee8aa',
      palegreen: '98fb98',
      paleturquoise: 'afeeee',
      palevioletred: 'db7093',
      papayawhip: 'ffefd5',
      peachpuff: 'ffdab9',
      peru: 'cd853f',
      pink: 'ffc0cb',
      plum: 'dda0dd',
      powderblue: 'b0e0e6',
      purple: '800080',
      rebeccapurple: '639',
      red: 'f00',
      rosybrown: 'bc8f8f',
      royalblue: '4169e1',
      saddlebrown: '8b4513',
      salmon: 'fa8072',
      sandybrown: 'f4a460',
      seagreen: '2e8b57',
      seashell: 'fff5ee',
      sienna: 'a0522d',
      silver: 'c0c0c0',
      skyblue: '87ceeb',
      slateblue: '6a5acd',
      slategray: '708090',
      slategrey: '708090',
      snow: 'fffafa',
      springgreen: '00ff7f',
      steelblue: '4682b4',
      tan: 'd2b48c',
      teal: '008080',
      thistle: 'd8bfd8',
      tomato: 'ff6347',
      turquoise: '40e0d0',
      violet: 'ee82ee',
      wheat: 'f5deb3',
      white: 'fff',
      whitesmoke: 'f5f5f5',
      yellow: 'ff0',
      yellowgreen: '9acd32',
    };

    for (const [color, value] of Object.entries(namedColorMap)) {
      expect(parseToRgba(color)).toEqual(parseToRgba(`#${value}`));
    }
  });
  it('should parse a hex color representation', () => {
    expect(parseToRgba('#Ff43AE')).toMatchInlineSnapshot(`
      Array [
        255,
        67,
        174,
        1,
      ]
    `);
  });

  it('should parse a reduced hex color representation', () => {
    expect(parseToRgba('#fff')).toMatchInlineSnapshot(`
      Array [
        255,
        255,
        255,
        1,
      ]
    `);
  });

  it('should parse an 8-digit hex color representation', () => {
    expect(parseToRgba('#Ff43AEFF')).toMatchInlineSnapshot(`
      Array [
        255,
        67,
        174,
        1,
      ]
    `);
  });

  it('should parse an 4-digit hex color representation', () => {
    expect(parseToRgba('#0f08')).toMatchInlineSnapshot(`
      Array [
        0,
        255,
        0,
        0.5333333333333333,
      ]
    `);
  });

  it('should parse a reduced hex color representation', () => {
    expect(parseToRgba('#45a')).toMatchInlineSnapshot(`
      Array [
        68,
        85,
        170,
        1,
      ]
    `);
  });

  it('should parse an rgba color representation', () => {
    expect(parseToRgba('rgba(174,67,255,0.6)')).toMatchInlineSnapshot(`
      Array [
        174,
        67,
        255,
        0.6,
      ]
    `);
    expect(parseToRgba('rgba( 174 , 67 , 255 , 0.6 )')).toMatchInlineSnapshot(`
      Array [
        174,
        67,
        255,
        0.6,
      ]
    `);
  });

  it('should parse an rgb color representation', () => {
    expect(parseToRgba('rgb(174,67,255)')).toMatchInlineSnapshot(`
      Array [
        174,
        67,
        255,
        1,
      ]
    `);
    expect(parseToRgba('rgb( 174 , 67 , 255 )')).toMatchInlineSnapshot(`
      Array [
        174,
        67,
        255,
        1,
      ]
    `);
  });

  it('should parse an hsl color representation', () => {
    expect(parseToRgba('hsl(210,10%,4%)')).toMatchInlineSnapshot(`
      Array [
        9,
        10,
        11,
        1,
      ]
    `);
    expect(parseToRgba('hsl( 210 , 10% , 4% )')).toMatchInlineSnapshot(`
      Array [
        9,
        10,
        11,
        1,
      ]
    `);
  });

  it('should parse an hsl color representation with decimal values', () => {
    expect(parseToRgba('hsl(210,16.4%,13.2%)')).toMatchInlineSnapshot(`
      Array [
        28,
        34,
        39,
        1,
      ]
    `);
    expect(parseToRgba('hsl( 210 , 16.4%, 13.2% )')).toMatchInlineSnapshot(`
      Array [
        28,
        34,
        39,
        1,
      ]
    `);
  });

  it('should parse an hsla color representation', () => {
    expect(parseToRgba('hsla(210,10%,40%,0.75)')).toMatchInlineSnapshot(`
      Array [
        92,
        102,
        112,
        0.75,
      ]
    `);
    expect(parseToRgba('hsla( 210 , 10% , 40% , 0.75 )'))
      .toMatchInlineSnapshot(`
      Array [
        92,
        102,
        112,
        0.75,
      ]
    `);
  });

  it('should parse an hsla color representation with decimal values', () => {
    expect(parseToRgba('hsla(210,0.5%,0.5%,1.0)')).toMatchInlineSnapshot(`
      Array [
        1,
        1,
        1,
        1,
      ]
    `);
    expect(parseToRgba('hsla( 210 , 0.5% , 0.5% , 1.0 )'))
      .toMatchInlineSnapshot(`
      Array [
        1,
        1,
        1,
        1,
      ]
    `);
  });

  it('should throw an error if an invalid color string is provided', () => {
    expect(() => {
      parseToRgba('(174,67,255)');
    }).toThrowErrorMatchingInlineSnapshot(
      `"Failed to parse color: \\"(174,67,255)\\""`
    );
  });

  it('should throw an error if an invalid color string is provided', () => {
    expect(() => {
      // @ts-ignore
      parseToRgba(12345);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Failed to parse color: \\"12345\\""`
    );
  });

  it('should throw an error if an invalid hsl string is provided', () => {
    expect(() => {
      parseToRgba('hsl(210,120%,4%)');
    }).toThrowErrorMatchingInlineSnapshot(
      `"Failed to parse color: \\"hsl(210,120%,4%)\\""`
    );
  });

  it('should throw an error if an unparsable hsla string is provided', () => {
    expect(() => {
      parseToRgba('hsla(210,120%,4%,0.7)');
    }).toThrowErrorMatchingInlineSnapshot(
      `"Failed to parse color: \\"hsla(210,120%,4%,0.7)\\""`
    );
  });
});
