import type { RankedItem } from "../types";
import { calculateNewStats, type GlickoPlayer } from "./math";

const toGlickoPlayer = (item: RankedItem): GlickoPlayer => {
  return {
    rating: item.rating,
    rd: item.rd,
    vol: item.vol,
  };
};

export const updateRatings = (
  winner: RankedItem,
  loser: RankedItem
): { winner: RankedItem; loser: RankedItem } => {
  const winnerPlayer = toGlickoPlayer(winner);
  const loserPlayer = toGlickoPlayer(loser);

  const newWinnerStats = calculateNewStats(winnerPlayer, loserPlayer, 1);
  const newLoserStats = calculateNewStats(loserPlayer, winnerPlayer, 0);

  return {
    winner: {
      ...winner,
      rating: newWinnerStats.rating,
      rd: newWinnerStats.rd,
      vol: newWinnerStats.vol,
      matches: winner.matches + 1,
    },
    loser: {
      ...loser,
      rating: newLoserStats.rating,
      rd: newLoserStats.rd,
      vol: newLoserStats.vol,
      matches: loser.matches + 1,
    },
  };
};
