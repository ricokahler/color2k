// Type definitions for color2k 2.0
// Project: https://github.com/ricokahler/color2k
// Definitions by: Mitchelle Creado <https://github.com/Mitchelle-Creado-15-06-1997>

/**
 * Parses a color string and returns it as an rgba string.
 */
export function parseToRgba(color: string): [number, number, number, number];

/**
 * Takes in any css color and returns it as an rgba string.
 */
export function toRgba(color: string): string;

/**
 * Takes in any css color and returns it as a hex string.
 */
export function toHex(color: string): string;

/**
 * Adjusts the transparency of a color.
 * @param color - the color to adjust
 * @param amount - a value between -1 and 1, where -1 is fully transparent
 */
export function transparentize(color: string, amount: number): string;

/**
 * Alias for transparentize.
 */
export function rgba(color: string, alpha: number): string;

/**
 * Makes a color more opaque.
 * @param color - the color to adjust
 * @param amount - a value between 0 and 1
 */
export function opacify(color: string, amount: number): string;

/**
 * Lightens a color by mixing it with white.
 * @param color - the color to lighten
 * @param amount - a value between 0 and 1
 */
export function lighten(color: string, amount: number): string;

/**
 * Darkens a color by mixing it with black.
 * @param color - the color to darken
 * @param amount - a value between 0 and 1
 */
export function darken(color: string, amount: number): string;

/**
 * Saturates a color.
 * @param color - the color to saturate
 * @param amount - a value between 0 and 1
 */
export function saturate(color: string, amount: number): string;

/**
 * Desaturates a color.
 * @param color - the color to desaturate
 * @param amount - a value between 0 and 1
 */
export function desaturate(color: string, amount: number): string;

/**
 * Returns the contrast ratio between two colors.
 */
export function getContrast(color1: string, color2: string): number;

/**
 * Returns either black or white, whichever has higher contrast with the given color.
 */
export function readableColor(
  color: string,
  lightReturnValue?: string,
  darkReturnValue?: string
): string;

/**
 * Mixes two colors together.
 * @param color1 - the first color
 * @param color2 - the second color
 * @param weight - a value between 0 and 1, where 0 is all color1 and 1 is all color2
 */
export function mix(color1: string, color2: string, weight: number): string;

/**
 * Guard function to check if a string is a valid color.
 */
export function guard(lowerBound: number, upperBound: number, value: number): number;