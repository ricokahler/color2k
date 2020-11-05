/**
 * This error is thrown if there is a color parsing error. You may use this
 * inside of catch block with `instanceof` to ignore color paring errors.
 */
declare class ColorError extends Error {
  constructor(color: string);
}

export default ColorError;
