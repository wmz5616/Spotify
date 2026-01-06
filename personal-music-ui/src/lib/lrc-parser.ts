export interface LyricLine {
  time: number;
  text: string;
}

export const parseLRC = (lrcText: string): LyricLine[] => {
  if (!lrcText) return [];

  const lines = lrcText.split("\n");
  const lyrics: LyricLine[] = [];
  const timeExp = /\[(\d{1,3}):(\d{2})[.:](\d{2,3})\]/g;

  for (const line of lines) {
    const text = line.replace(timeExp, "").trim();
    if (!text) continue;
    let match;
    while ((match = timeExp.exec(line)) !== null) {

      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, "0"), 10);
      const time = minutes * 60 + seconds + milliseconds / 1000;

      lyrics.push({ time, text });
    }
  }
  return lyrics.sort((a, b) => a.time - b.time);
};
