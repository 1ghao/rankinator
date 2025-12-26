const TAU = 0.5; // Volatibility (between 0.3 and 1.2 usually)

// Standard conversion constant
const GLICKO_SCALE = 173.7178;

export interface GlickoPlayer {
  rating: number; // Standard Scale (e.g. 1500)
  rd: number; // Standard Deviation (e.g. 350)
  vol: number; // Volatility (e.g. 0.06)
}

const toGlickoScale = (player: GlickoPlayer) => {
  return {
    mu: (player.rating - 1500) / GLICKO_SCALE,
    phi: player.rd / GLICKO_SCALE,
    sigma: player.vol,
  };
};

const toStandardScale = (
  mu: number,
  phi: number,
  sigma: number
): GlickoPlayer => {
  return {
    rating: mu * GLICKO_SCALE + 1500,
    rd: phi * GLICKO_SCALE,
    vol: sigma,
  };
};

// Helper G function: Reduces the impact of games based on opponent's RD
const g = (phi: number) => {
  return 1 / Math.sqrt(1 + (3 * phi ** 2) / Math.PI ** 2);
};

// Helper E function: Expected outcome probability
const E = (mu: number, mu_j: number, phi_j: number) => {
  return 1 / (1 + Math.exp(-g(phi_j) * (mu - mu_j)));
};

export const calculateNewStats = (
  player: GlickoPlayer,
  opponent: GlickoPlayer,
  score: 0 | 0.5 | 1 // 1 = Player won, 0 = Player lost
): GlickoPlayer => {
  // Step 1: Convert to Glicko-2 internal scale
  const p = toGlickoScale(player);
  const o = toGlickoScale(opponent);

  // Step 2: Compute Variance (v)
  const g_phi_j = g(o.phi);
  const E_val = E(p.mu, o.mu, o.phi);

  const v = 1 / (g_phi_j ** 2 * E_val * (1 - E_val));

  // Step 3: Compute Delta
  // The difference between actual score and expected score, weighted by variance
  const delta = v * g_phi_j * (score - E_val);

  // Step 4: Update Volatility (Sigma)
  // We solve iteratively for the new volatility using the "Illinois Algorithm"
  const a = Math.log(p.sigma ** 2);
  const f = (x: number) => {
    const eX = Math.exp(x);
    const term1 =
      (eX * (delta ** 2 - p.phi ** 2 - v - eX)) /
      (2 * (p.phi ** 2 + v + eX) ** 2);
    const term2 = (x - a) / TAU ** 2;
    return term1 - term2;
  };

  let A = a;
  let B = 0;
  if (delta ** 2 > p.phi ** 2 + v) {
    B = Math.log(delta ** 2 - p.phi ** 2 - v);
  } else {
    let k = 1;
    while (f(a - k * TAU) < 0) {
      k += 1;
    }
    B = a - k * TAU;
  }

  let fA = f(A);
  let fB = f(B);

  // Iteration to find new volatility
  while (Math.abs(B - A) > 0.000001) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB < 0) {
      A = B;
      fA = fB;
    } else {
      fA = fA / 2;
    }
    B = C;
    fB = fC;
  }

  const newSigma = Math.exp(A / 2);

  // Step 5: Update Rating Deviation (Phi) and Rating (Mu)
  const phiStar = Math.sqrt(p.phi ** 2 + newSigma ** 2);

  const newPhi = 1 / Math.sqrt(1 / phiStar ** 2 + 1 / v);
  const newMu = p.mu + newPhi ** 2 * g_phi_j * (score - E_val);

  // Step 6: Convert back to standard scale
  return toStandardScale(newMu, newPhi, newSigma);
};
