import {
    parseToRgba,
    toRgba,
    toHex,
    transparentize,
    rgba,
    opacify,
    lighten,
    darken,
    saturate,
    desaturate,
    getContrast,
    readableColor,
    mix,
  } from "color2k";
  
  // $ExpectType [number, number, number, number]
  const parsed = parseToRgba("red");
  
  // $ExpectType string
  const rgbaStr = toRgba("#fff");
  
  // $ExpectType string
  const hex = toHex("rgba(255,0,0,1)");
  
  // $ExpectType string
  const trans = transparentize("red", 0.5);
  
  // $ExpectType string
  const rgbaAlias = rgba("red", 0.5);
  
  // $ExpectType string
  const opaque = opacify("rgba(255,0,0,0.5)", 0.5);
  
  // $ExpectType string
  const lighter = lighten("red", 0.2);
  
  // $ExpectType string
  const darker = darken("red", 0.2);
  
  // $ExpectType string
  const saturated = saturate("red", 0.2);
  
  // $ExpectType string
  const desaturated = desaturate("red", 0.2);
  
  // $ExpectType number
  const contrast = getContrast("red", "white");
  
  // $ExpectType string
  const readable = readableColor("red");
  const readableCustom = readableColor("red", "#fff", "#000");
  
  // $ExpectType string
  const mixed = mix("red", "blue", 0.5);