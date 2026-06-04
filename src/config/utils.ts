export function hex(c: number): string {
  return '#' + c.toString(16).padStart(6, '0');
}

export function darker(c: number, a: number): number {
  const r = Math.floor(((c >> 16) & 0xFF) * (1 - a));
  const g = Math.floor(((c >> 8) & 0xFF) * (1 - a));
  const b = Math.floor((c & 0xFF) * (1 - a));
  return (r << 16) | (g << 8) | b;
}

export function lighter(c: number, a: number): number {
  const r = Math.min(255, Math.floor(((c >> 16) & 0xFF) + (255 - ((c >> 16) & 0xFF)) * a));
  const g = Math.min(255, Math.floor(((c >> 8) & 0xFF) + (255 - ((c >> 8) & 0xFF)) * a));
  const b = Math.min(255, Math.floor((c & 0xFF) + (255 - (c & 0xFF)) * a));
  return (r << 16) | (g << 8) | b;
}
