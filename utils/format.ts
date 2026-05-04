export function fmt(n: number): string {
  return isNaN(n) || !isFinite(n) ? "—" : "$" + Math.round(n).toLocaleString();
}

export function parseDollar(s: string): number {
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}
