const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

export function formatNumber(n: number): string {
  if (n < 1000) return Math.floor(n).toString();
  const tier = Math.floor(Math.log10(Math.abs(n)) / 3);
  if (tier >= SUFFIXES.length) {
    return n.toExponential(2);
  }
  const scaled = n / Math.pow(10, tier * 3);
  const formatted = scaled >= 100 ? Math.floor(scaled).toString()
    : scaled >= 10 ? scaled.toFixed(1)
    : scaled.toFixed(2);
  return formatted + SUFFIXES[tier];
}

export function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function formatGold(n: number): string {
  return formatNumber(n) + ' G';
}
