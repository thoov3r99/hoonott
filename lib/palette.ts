export const PALETTE: readonly string[] = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#78716c", // stone
] as const;

export function nextFreeColor(usedColors: ReadonlyArray<string | null>): string {
  const used = new Set(
    usedColors.filter((c): c is string => typeof c === "string")
  );
  for (const color of PALETTE) {
    if (!used.has(color)) return color;
  }
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

export function isPaletteColor(value: string): boolean {
  return PALETTE.includes(value);
}
