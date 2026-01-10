export interface LyricLine {
  time: number;
  text: string;
}

export function parseLRC(lrc: string): LyricLine[] {
  if (!lrc) return [];

  const lines = lrc.split(/\r?\n/);
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    const matches = [...trimmedLine.matchAll(timeRegex)];

    if (matches.length > 0) {
      const text = trimmedLine.replace(timeRegex, "").trim();

      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = match[3]
          ? parseInt(match[3].padEnd(3, "0").slice(0, 3), 10)
          : 0;

        const time = minutes * 60 + seconds + milliseconds / 1000;

        result.push({
          time,
          text,
        });
      }
    }
  }

  result.sort((a, b) => a.time - b.time);

  return result;
}
