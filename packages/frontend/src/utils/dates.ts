export const toLocalDateStr = (d: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const formatHourString = (isoString: string): string => {
  const d = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Minutes since midnight in local time.
export const minutesOfDay = (isoString: string): number => {
  const d = new Date(isoString);
  return d.getHours() * 60 + d.getMinutes();
};
