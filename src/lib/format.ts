export function formatCountdown(dateStr: string | Date): string {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) return "now";

  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (day > 365) {
    const years = Math.floor(day / 365);
    const remDays = day % 365;
    return remDays > 30 ? `${years}y ${Math.floor(remDays / 30)}mo` : `${years}y ${remDays}d`;
  }
  if (day > 30) {
    const months = Math.floor(day / 30);
    const remDays = day % 30;
    return remDays > 0 ? `${months}mo ${remDays}d` : `${months}mo`;
  }
  if (day > 0) return `${day}d ${hr % 24}h`;
  if (hr > 0) return `${hr}h ${min % 60}m`;
  if (min > 0) return `${min}m`;
  return `${sec}s`;
}

export function formatDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocal(value: string): Date {
  return new Date(value);
}
