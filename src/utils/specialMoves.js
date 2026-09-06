/**
 * Handles the moves whose damage doesn't come from a flat base power —
 * weight-based, speed-ratio-based, fainted-ally-based, or multi-hit moves.
 * Pure data in/out (no imports from damageCalculator.js) so there's no
 * circular dependency; damageCalculator.js computes whatever raw inputs
 * (speeds, weights, etc.) these formulas need and passes them in.
 */

// Moves that always land as a critical hit, regardless of the crit toggle.
export const ALWAYS_CRIT_MOVES = new Set([
  'surging-strikes',
  'wicked-blow',
  'storm-throw',
  'frost-breath',
  'flower-trick',
  'zippy-zap', // auto-crit in the Let's Go games / early Gen 8; kept for safety
]);

export const isAlwaysCrit = (moveApiName) => ALWAYS_CRIT_MOVES.has(moveApiName);

// Fixed, well-documented per-hit power tables for moves whose power escalates
// hit-to-hit (as opposed to uniform multi-hit moves like Dual Wingbeat, where
// every hit is the same power).
const ESCALATING_POWER_TABLES = {
  'triple-axel': [20, 40, 60],
  'triple-kick': [10, 20, 30],
};

/**
 * Weight-based moves: power depends on the DEFENDER's weight.
 */
const WEIGHT_BASED_MOVES = new Set(['low-kick', 'grass-knot']);

const weightBasedPower = (weightKg) => {
  if (weightKg == null) return null;
  if (weightKg < 10) return 20;
  if (weightKg < 25) return 40;
  if (weightKg < 50) return 60;
  if (weightKg < 100) return 80;
  if (weightKg < 200) return 100;
  return 120;
};

/**
 * Given a move and the raw stats/context needed for its special case,
 * returns { perHitPowers: [n1, n2, ...], note }. For an ordinary single-hit
 * move this is just { perHitPowers: [move.basePower] }. For multi-hit moves
 * it's one entry PER hit — callers run the full damage formula once per
 * entry and sum the results, rather than summing power up front (that would
 * under-floor compared to the real per-hit-independent game engine, e.g.
 * for Triple Axel's escalating power).
 *
 * @param {Object} move - fetched move details (apiName, basePower, minHits, maxHits, ...)
 * @param {Object} ctx - { attackerSpeed, defenderSpeed, defenderWeightKg,
 *                          attackerBaseAtk, faintedAllies, hitCount, teamBaseAttacks }
 */
export function getEffectiveMovePower(move, ctx = {}) {
  const apiName = move?.apiName;
  const basePower = move?.basePower || 0;

  if (WEIGHT_BASED_MOVES.has(apiName)) {
    const power = weightBasedPower(ctx.defenderWeightKg);
    return {
      perHitPowers: [power ?? basePower],
      note: power != null ? `${ctx.defenderWeightKg}kg target -> ${power} BP` : null,
    };
  }

  if (apiName === 'electro-ball') {
    const atkSpeed = Math.max(1, ctx.attackerSpeed || 1);
    const defSpeed = Math.max(1, ctx.defenderSpeed || 1);
    const ratio = atkSpeed / defSpeed;
    let power;
    if (ratio >= 4) power = 150;
    else if (ratio >= 3) power = 120;
    else if (ratio >= 2) power = 80;
    else if (ratio >= 1) power = 60;
    else power = 40;
    return { perHitPowers: [power], note: `Speed ratio ${ratio.toFixed(2)} -> ${power} BP` };
  }

  if (apiName === 'gyro-ball') {
    const atkSpeed = Math.max(1, ctx.attackerSpeed || 1);
    const defSpeed = Math.max(1, ctx.defenderSpeed || 1);
    const power = Math.max(1, Math.min(150, Math.floor((25 * defSpeed) / atkSpeed)));
    return { perHitPowers: [power], note: `Speed ratio -> ${power} BP` };
  }

  if (apiName === 'last-respects') {
    const fainted = Math.max(0, ctx.faintedAllies || 0);
    const power = 50 + 50 * fainted;
    return { perHitPowers: [power], note: `${fainted} fainted ally/allies -> ${power} BP` };
  }

  if (apiName === 'beat-up') {
    // Per pokemondb: each hit uses THAT party member's own base Attack
    // (floor(baseAtk/10)+5 BP), while the attack/defense STAT ratio in the
    // formula always uses the active Pokémon's own real Attack stat (with
    // its EVs/nature/item applied) — only the power-per-hit varies.
    // ctx.teamBaseAttacks is the list of base Attack values for every
    // populated team slot (including the active Pokémon itself), which is
    // exactly the "healthy party members" Beat Up hits with.
    const teamAtks = ctx.teamBaseAttacks && ctx.teamBaseAttacks.length > 0
      ? ctx.teamBaseAttacks
      : [ctx.attackerBaseAtk || 0]; // fallback if no team data is available
    const perHitPowers = teamAtks.map((atk) => Math.floor(atk / 10) + 5);
    return {
      perHitPowers,
      note: `${perHitPowers.length} hit(s) from team (${perHitPowers.join('+')} BP)`,
    };
  }

  if (ESCALATING_POWER_TABLES[apiName]) {
    const table = ESCALATING_POWER_TABLES[apiName];
    const hits = Math.max(1, Math.min(table.length, ctx.hitCount || table.length));
    return { perHitPowers: table.slice(0, hits), note: `${hits} hit(s), escalating power` };
  }

  // Generic uniform multi-hit move (Dual Wingbeat, Surging Strikes, Bullet
  // Seed, Icicle Spear, Bone Rush, Double Hit, Population Bomb, etc.) — same
  // power every hit.
  if (move?.maxHits && move.maxHits > 1) {
    const hits = Math.max(move.minHits || 1, Math.min(move.maxHits, ctx.hitCount || move.maxHits));
    return { perHitPowers: Array(hits).fill(basePower), note: `${hits} hit(s)` };
  }

  return { perHitPowers: [basePower], note: null };
}

/**
 * Whether a move needs the hit-count selector shown next to it in the UI,
 * and what range that selector should offer. Beat Up is deliberately NOT
 * included here anymore — its hit count is derived automatically from how
 * many team slots are filled, not a manual choice.
 */
export function getHitCountRange(move) {
  if (!move) return null;
  if (ESCALATING_POWER_TABLES[move.apiName]) {
    return [1, ESCALATING_POWER_TABLES[move.apiName].length];
  }
  if (move.maxHits && move.maxHits > 1) {
    return [move.minHits || 1, move.maxHits];
  }
  return null;
}

export const needsWeightData = (moveApiName) => WEIGHT_BASED_MOVES.has(moveApiName);
export const needsSpeedData = (moveApiName) => moveApiName === 'electro-ball' || moveApiName === 'gyro-ball';
export const needsFaintedAllyCount = (moveApiName) => moveApiName === 'last-respects';
export const isBeatUp = (moveApiName) => moveApiName === 'beat-up';
