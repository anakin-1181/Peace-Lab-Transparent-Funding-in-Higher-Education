export function formatCurrencyK(value: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0
  }).format(value * 1000);
}

export function formatShortK(value: number) {
  return new Intl.NumberFormat('en-GB', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
}

export function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}
