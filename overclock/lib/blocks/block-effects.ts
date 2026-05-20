export function getBlockRevalidationPaths(input: {
  currentUsername?: string | null;
  targetUsername?: string | null;
}) {
  const paths = [
    "/account",
    "/duos",
    "/lfg",
    "/matches",
    "/search/users",
    "/stacks",
  ];

  if (input.currentUsername) {
    paths.push(`/u/${input.currentUsername}`);
  }

  if (input.targetUsername) {
    paths.push(`/u/${input.targetUsername}`);
  }

  return paths;
}
