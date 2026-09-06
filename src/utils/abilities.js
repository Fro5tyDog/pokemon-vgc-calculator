/**
 * Ability effects relevant to damage calculation. This is a deliberately
 * scoped subset, not an exhaustive implementation of every ability in the
 * game — it covers the mechanics that most directly change a damage number:
 * type-absorbing immunities, crit/priority blocking, flat damage-reduction
 * abilities, and the Mold Breaker-class abilities that bypass all of those.
 *
 * Not covered (out of scope for a damage calculator): Sturdy (survival, not
 * damage amount), stat-draining/contact abilities like Rough Skin, weather-
 * setting abilities, and anything requiring turn-order or switch-in
 * simulation beyond the simple toggles below.
 *
 * Abilities are matched by their display name (title-cased, e.g.
 * "Mold Breaker") since that's what's stored on Pokémon state throughout
 * the app — consistent with how Adaptability/Technician/etc. already work
 * in damageCalculator.js.
 */

// Ignore the target's ability-based damage reduction/immunity/crit-block/
// priority-block effects entirely.
export const MOLD_BREAKER_ABILITIES = new Set(['Mold Breaker', 'Teravolt', 'Turboblaze']);
export const hasMoldBreaker = (ability) => MOLD_BREAKER_ABILITIES.has(ability);

// Absorbs a specific type entirely (0 damage) — some also heal/boost a stat
// in-game, but for damage-calc purposes the relevant effect is the immunity.
const TYPE_ABSORB_ABILITIES = {
  'Water Absorb': 'Water',
  'Volt Absorb': 'Electric',
  'Motor Drive': 'Electric',
  'Lightning Rod': 'Electric',
  'Storm Drain': 'Water',
  'Flash Fire': 'Fire',
  'Sap Sipper': 'Grass',
  'Dry Skin': 'Water', // Dry Skin also takes 1.25x from Fire — handled separately below
};

const LEVITATE = 'Levitate';
const WONDER_GUARD = 'Wonder Guard';

// Flat damage-reduction abilities: { ability: multiplier }
const FLAT_REDUCTION_ABILITIES = {
  Multiscale: 0.5, // assumes defender is at full HP — this tool has no HP tracking to check that
  'Shadow Shield': 0.5, // same assumption
};

// Reduce only super-effective hits (typeEffect > 1)
const FILTER_ABILITIES = new Set(['Filter', 'Solid Rock', 'Prism Armor']);

const CRIT_BLOCKING_ABILITIES = new Set(['Battle Armor', 'Shell Armor']);
const PRIORITY_BLOCKING_ABILITIES = new Set(['Armor Tail', 'Dazzling', 'Queenly Majesty']);

/**
 * Full immunity check (0 damage). Returns true if the defender's ability
 * blocks this move type entirely and the attacker doesn't bypass it.
 * Gravity grounds Levitate users, removing their Ground immunity — that
 * specific case is checked here since it's ability-driven; the Flying-type
 * Ground immunity itself is handled separately in damageCalculator.js via
 * the type chart (since it's type-based, not ability-based).
 */
export function isTypeImmune(defenderAbility, moveType, typeEffect, attackerHasMoldBreaker, gravityActive) {
  if (attackerHasMoldBreaker) return false;
  if (TYPE_ABSORB_ABILITIES[defenderAbility] === moveType) return true;
  if (defenderAbility === LEVITATE && moveType === 'Ground' && !gravityActive) return true;
  if (defenderAbility === WONDER_GUARD && typeEffect <= 1) return true;
  return false;
}

/**
 * Whether this hit is blocked entirely by a priority-blocking ability
 * (Armor Tail / Dazzling / Queenly Majesty stop priority moves outright).
 */
export function isPriorityBlocked(defenderAbility, movePriority, attackerHasMoldBreaker) {
  if (attackerHasMoldBreaker) return false;
  return PRIORITY_BLOCKING_ABILITIES.has(defenderAbility) && (movePriority || 0) > 0;
}

/** Whether the defender's ability prevents this from being a critical hit. */
export function isCritBlocked(defenderAbility, attackerHasMoldBreaker) {
  if (attackerHasMoldBreaker) return false;
  return CRIT_BLOCKING_ABILITIES.has(defenderAbility);
}

/**
 * Flat multiplier from the defender's damage-reducing abilities that don't
 * grant full immunity (Multiscale, Filter/Solid Rock/Prism Armor, Thick
 * Fat, Heatproof, Dry Skin's Fire weakness). Combine multiplicatively with
 * everything else already in the pipeline.
 */
export function getDefensiveDamageMultiplier(defenderAbility, moveType, typeEffect, attackerHasMoldBreaker) {
  if (attackerHasMoldBreaker) return 1;

  let mult = 1;

  if (FLAT_REDUCTION_ABILITIES[defenderAbility] != null) {
    mult *= FLAT_REDUCTION_ABILITIES[defenderAbility];
  }
  if (FILTER_ABILITIES.has(defenderAbility) && typeEffect > 1) {
    mult *= 0.75;
  }
  if (defenderAbility === 'Thick Fat' && (moveType === 'Fire' || moveType === 'Ice')) {
    mult *= 0.5;
  }
  if (defenderAbility === 'Heatproof' && moveType === 'Fire') {
    mult *= 0.5;
  }
  if (defenderAbility === 'Dry Skin' && moveType === 'Fire') {
    mult *= 1.25;
  }

  return mult;
}

// Abilities that boost the Pokémon's own highest non-HP stat by 1.3x when
// active (Paradox Pokémon, triggered by Booster Energy or matching weather/
// terrain — this tool just offers it as a manual toggle).
export const BOOSTER_ABILITIES = new Set(['Protosynthesis', 'Quark Drive']);

/**
 * Which of a Pokémon's 5 non-HP stats is highest (by base+nature+EV, before
 * stat stages) — that's the stat Protosynthesis/Quark Drive boosts. Fixed
 * at activation time in-game, so stages changing later don't move the boost.
 */
export function getBoostedStatKey(computeStatFn, baseStat, iv, ev, level, natureData, getNatureMultiplier) {
  const keys = ['atk', 'def', 'spa', 'spd', 'spe'];
  let bestKey = 'atk';
  let bestValue = -Infinity;
  for (const key of keys) {
    const value = computeStatFn(
      baseStat[key],
      iv?.[key] ?? 31,
      ev?.[key] || 0,
      level,
      getNatureMultiplier(natureData, key)
    );
    if (value > bestValue) {
      bestValue = value;
      bestKey = key;
    }
  }
  return bestKey;
}

// Intimidate: lowers the OPPONENT's Attack by 1 stage. Modeled as a toggle
// on the Pokémon that HAS Intimidate, applied to the other side's effective
// stat stage (see combatant.js's withIncomingEffects).
export const INTIMIDATE = 'Intimidate';

/** Abilities this app offers an "active/triggered" checkbox for. */
export const TOGGLEABLE_ABILITIES = new Set([INTIMIDATE, 'Protosynthesis', 'Quark Drive']);
