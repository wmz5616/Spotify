export interface LyricLine {
  time: number;
  text: string;
}

export const parseLRC = (lrcText: string): LyricLine[] => {
  const lines = lrcText.split("\n");
  const lyrics: LyricLine[] = [];

  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, "0"), 10);
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = match[4].trim();
      lyrics.push({ time, text });
    }
  }

  return lyrics.sort((a, b) => a.time - b.time);
};
