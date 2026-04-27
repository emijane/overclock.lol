export function normalizeLFGPostTitle(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function normalizeLFGPostTitleForComparison(value: string) {
  return normalizeLFGPostTitle(value).toLocaleLowerCase("en-US");
}
