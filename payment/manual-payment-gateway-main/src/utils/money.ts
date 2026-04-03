export function parseBirrAmount(input: string): number {
  const cleaned = input.replace(/[^\d.\-]/g, '');
  return Number(cleaned || 0);
}
