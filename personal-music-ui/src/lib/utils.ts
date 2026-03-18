import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDuration = (seconds: number | undefined | null) => {
  if (seconds == null) {
    return "-:--";
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const cleanSongTitle = (
  title: string,
  artists?: { name: string }[] | string | null
) => {
  if (!title) return "";

  let artistNames: string[] = [];
  if (Array.isArray(artists)) {
    artistNames = artists.map((a) => a.name);

    if (artistNames.length > 1) {
      artistNames.push(artistNames.join(" & "));
      artistNames.push(artistNames.join("&"));
      artistNames.push(artistNames.join(", "));
      artistNames.push(artistNames.join(" , "));
    }
  } else if (typeof artists === "string") {

    artistNames = [artists];
  }

  artistNames.sort((a, b) => b.length - a.length);

  const lowerTitle = title.toLowerCase();

  for (const artist of artistNames) {
    if (!artist) continue;
    const lowerArtist = artist.toLowerCase();

    if (lowerTitle.startsWith(`${lowerArtist} - `)) {
      return title.slice(artist.length + 3);
    }

    if (lowerTitle.startsWith(`${lowerArtist} -`)) {
      return title.slice(artist.length + 2);
    }

    if (lowerTitle.startsWith(`${lowerArtist}-`)) {
      return title.slice(artist.length + 1);
    }
  }

  return title;
};
