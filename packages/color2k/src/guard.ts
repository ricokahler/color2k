function guard(low: number, high: number, value: number) {
  return Math.min(Math.max(low, value), high);
}

export default guard;
