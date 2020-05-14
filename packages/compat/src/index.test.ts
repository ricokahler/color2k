import parseToRgba from './';

describe('parseToRgb', () => {
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

  it('should parse a rgba color representation', () => {
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

  it('should parse a rgb color representation', () => {
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

  it('should parse a hsl color representation', () => {
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

  it('should parse a hsl color representation with decimal values', () => {
    expect(parseToRgba('hsl(210,16.4%,13.2%)')).toMatchInlineSnapshot(`
      Array [
        28,
        33,
        38,
        1,
      ]
    `);
    expect(parseToRgba('hsl( 210 , 16.4%, 13.2% )')).toMatchInlineSnapshot(`
      Array [
        28,
        33,
        38,
        1,
      ]
    `);
  });

  it('should parse a hsla color representation', () => {
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

  it('should parse a hsla color representation with decimal values', () => {
    expect(parseToRgba('hsla(210,0.5%,0.5%,1.0)')).toMatchInlineSnapshot(`
      Array [
        0,
        0,
        0,
        1,
      ]
    `);
    expect(parseToRgba('hsla( 210 , 0.5% , 0.5% , 1.0 )'))
      .toMatchInlineSnapshot(`
      Array [
        0,
        0,
        0,
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
