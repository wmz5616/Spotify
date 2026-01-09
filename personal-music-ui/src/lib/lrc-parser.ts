export interface LyricLine {
  time: number;
  text: string;
}

export const parseLRC = (lrcText: string): LyricLine[] => {
  if (!lrcText) return [];

  const lines = lrcText.split(/\r?\n/);
  const lyrics: LyricLine[] = [];
  const timeRegex = /\[(\d{1,3}):(\d{1,2})(?:\.(\d{1,3}))?\]/g;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const text = trimmedLine.replace(timeRegex, "").trim();

    let match;
    let hasMatch = false;
    timeRegex.lastIndex = 0;

    while ((match = timeRegex.exec(trimmedLine)) !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      hasMatch = true;
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const msPart = match[3] || "0";
      const milliseconds = parseInt(msPart.padEnd(3, "0"), 10);
      const time = minutes * 60 + seconds + milliseconds / 1000;

      lyrics.push({ time, text });
    }
  }

  lyrics.sort((a, b) => a.time - b.time);

  const mergedLyrics: LyricLine[] = [];
  if (lyrics.length > 0) {
    mergedLyrics.push(lyrics[0]);

    for (let i = 1; i < lyrics.length; i++) {
      const prev = mergedLyrics[mergedLyrics.length - 1];
      const curr = lyrics[i];

      if (Math.abs(curr.time - prev.time) < 0.1) {
        if (curr.text && !prev.text.includes(curr.text)) {
          prev.text += "\n" + curr.text;
        }
      } else {
        mergedLyrics.push(curr);
      }
    }
  }

  return mergedLyrics;
};
