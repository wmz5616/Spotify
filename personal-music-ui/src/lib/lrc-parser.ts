export interface LyricLine {
  time: number;
  text: string;
}

export const parseLRC = (lrcText: string): LyricLine[] => {
  if (!lrcText) return [];

  const lines = lrcText.split("\n");
  const lyrics: LyricLine[] = [];
  const timeExp = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

  for (const line of lines) {
    const text = line.replace(timeExp, "").trim();
    if (!text) continue;

    let match;
    timeExp.lastIndex = 0;

    while ((match = timeExp.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const msString = match[3] || "0";
      const milliseconds = parseInt(msString.padEnd(3, "0"), 10);
      const time = minutes * 60 + seconds + milliseconds / 1000;

      lyrics.push({ time, text });
    }
  }

  const sortedLyrics = lyrics.sort((a, b) => a.time - b.time);
  const mergedLyrics: LyricLine[] = [];

  sortedLyrics.forEach((line) => {
    const lastLine = mergedLyrics[mergedLyrics.length - 1];

    if (lastLine && Math.abs(lastLine.time - line.time) < 0.001) {
      lastLine.text += "\n" + line.text;
    } else {
      mergedLyrics.push(line);
    }
  });

  return mergedLyrics;
};
