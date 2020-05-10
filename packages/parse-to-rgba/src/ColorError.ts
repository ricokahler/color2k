class ColorError extends Error {
  constructor(color: string) {
    super(`Failed to parse color: "${color}"`);
  }
}

export default ColorError;
