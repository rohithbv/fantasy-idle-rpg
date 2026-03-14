export function now(): number {
  return Date.now();
}

export function elapsed(since: number): number {
  return Date.now() - since;
}

export function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}
