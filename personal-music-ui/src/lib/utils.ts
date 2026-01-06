export const formatDuration = (seconds: number | undefined | null) => {
  if (seconds == null) {
    return "-:--";
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};
