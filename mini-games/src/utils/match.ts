export function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

export function compareNames(expected: string, actual: string, threshold = 0.75): boolean {
  const e = normalizeName(expected);
  const a = normalizeName(actual);
  if (!e || !a) return false;
  if (e === a) return true;

  const eTokens = new Set(e.split(' '));
  const aTokens = new Set(a.split(' '));
  const common = [...eTokens].filter((x) => aTokens.has(x)).length;
  const score = common / Math.max(eTokens.size, aTokens.size);
  return score >= threshold;
}

export function compareLastDigits(expected: string, actualMasked: string, digits = 4): boolean {
  const e = expected.replace(/\D/g, '');
  const a = actualMasked.replace(/\D/g, '');
  return e.slice(-digits) === a.slice(-digits);
}
