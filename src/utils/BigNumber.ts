// Simple big number wrapper for late-game values
// Uses native number until values get very large, then switches to notation
export class BigNum {
  private value: number;

  constructor(val: number = 0) {
    this.value = val;
  }

  add(n: number | BigNum): BigNum {
    const v = n instanceof BigNum ? n.value : n;
    return new BigNum(this.value + v);
  }

  subtract(n: number | BigNum): BigNum {
    const v = n instanceof BigNum ? n.value : n;
    return new BigNum(Math.max(0, this.value - v));
  }

  multiply(n: number): BigNum {
    return new BigNum(this.value * n);
  }

  gte(n: number | BigNum): boolean {
    const v = n instanceof BigNum ? n.value : n;
    return this.value >= v;
  }

  toNumber(): number {
    return this.value;
  }

  static from(val: number): BigNum {
    return new BigNum(val);
  }
}
