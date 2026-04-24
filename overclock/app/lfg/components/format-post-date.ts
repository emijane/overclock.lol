export function formatPostDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  const now = Date.now();

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const diffMs = now - date.getTime();

  if (diffMs < 60_000) {
    return "just now";
  }

  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}
