import type { RankedItem } from "../types";

export const getNextMatchup = (
  items: RankedItem[]
): [RankedItem, RankedItem] | null => {
  if (items.length < 2) return null;

  // Sort by Fewest matches first, then highest uncertainty/RD
  const sortedByNeed = [...items].sort((a, b) => {
    if (a.matches === b.matches) {
      return b.rd - a.rd; // If matches are equal, prioritize higher uncertainty
    }
    return a.matches - b.matches;
  });

  const candidateIndex = Math.floor(
    Math.random() * Math.min(3, sortedByNeed.length)
  );
  const candidateA = sortedByNeed[candidateIndex];

  const idealRatingDiff = 100;

  const potentialOpponents = items.filter((item) => item.id !== candidateA.id);

  let closeOpponents = potentialOpponents.filter(
    (item) => Math.abs(item.rating - candidateA.rating) <= idealRatingDiff
  );

  if (closeOpponents.length === 0) {
    closeOpponents = potentialOpponents.sort(
      (a, b) =>
        Math.abs(a.rating - candidateA.rating) -
        Math.abs(b.rating - candidateA.rating)
    );
    closeOpponents = closeOpponents.slice(0, 3);
  }

  const candidateB =
    closeOpponents[Math.floor(Math.random() * closeOpponents.length)];

  return [candidateA, candidateB];
};
