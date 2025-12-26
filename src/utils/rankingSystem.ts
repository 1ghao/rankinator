import type { RankedItem } from "../types";
import { calculateNewStats, type GlickoPlayer } from "./math";

const toGlickoPlayer = (item: RankedItem): GlickoPlayer => {
  return {
    rating: item.rating,
    rd: item.rd,
    vol: item.vol,
  };
};

export const processMatch = (
  item1: RankedItem,
  item2: RankedItem,
  result: 0 | 0.5 | 1
): { item1: RankedItem; item2: RankedItem } => {
  const player1 = toGlickoPlayer(item1);
  const player2 = toGlickoPlayer(item2);

  const newStats1 = calculateNewStats(player1, player2, result);
  const score2 = result === 0.5 ? 0.5 : result === 1 ? 0 : 1;
  const newStats2 = calculateNewStats(player2, player1, score2);

  return {
    item1: {
      ...item1,
      rating: newStats1.rating,
      rd: newStats1.rd,
      vol: newStats1.vol,
      matches: item1.matches + 1,
    },
    item2: {
      ...item2,
      rating: newStats2.rating,
      rd: newStats2.rd,
      vol: newStats2.vol,
      matches: item2.matches + 1,
    },
  };
};
