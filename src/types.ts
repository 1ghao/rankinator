export interface RankedItem {
  id: string;
  name: string;
  image?: string;
  // Glicko-2 stats
  rating: number;
  rd: number;
  vol: number;
  matches: number;
}

export interface MatchResult {
  winnerId: string;
  loserId: string;
}
