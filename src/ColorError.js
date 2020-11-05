function ColorError(color) {
  var instance = new Error(`Failed to parse color: "${color}"`);
  Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
  return instance;
}
ColorError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: Error,
    enumerable: false,
    writable: true,
    configurable: true,
  },
});
Object.setPrototypeOf(ColorError, Error);

export default ColorError;
