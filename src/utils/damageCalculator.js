/**
 * Pokémon Gen 9 damage calculator
 * Based on the damage formula: ((2 * Level / 5 + 2) * Power * A/D / 50 + 2) * [crit 1.5x] * STAB * Type1 * Type2 * random
 * Critical hits are a flat 1.5x multiplier applied as their own step (Gen 6+
 * mechanic), not the old Gen 1-5 "double the effective level" approach.
 * All intermediate results are floored (rounded down), except the /4096
 * fixed-point modifiers (crit, multi-target reduction, etc.), which round
 * half up.
 */
import { getEffectiveMovePower, ATTACK_STAT_OVERRIDES, DEFENSE_STAT_OVERRIDES } from './specialMoves';
import {
  hasMoldBreaker,
  isTypeImmune,
  isPriorityBlocked,
  isCritBlocked,
  getDefensiveDamageMultiplier,
  BOOSTER_ABILITIES,
  getBoostedStatKey,
} from './abilities';

/**
 * Floor division - mimics Pokémon's integer math
 */
const floorDivide = (numerator, denominator) => {
  return Math.floor(numerator / denominator);
};

/**
 * Round-half-up division for the /4096 fixed-point modifiers the real
 * games use (multi-target reduction, item/ability/weather multipliers
 * expressed as X/4096, etc). Unlike the plain percentage steps (the
 * 85-100 random roll, EV/4), these are NOT simply floored — the games
 * add half the denominator before the integer divide, which rounds
 * ties up instead of always down.
 */
const roundDivide4096 = (numerator, numerator4096) => {
  return Math.floor((numerator * numerator4096 + 2048) / 4096);
};

/**
 * Get nature multiplier for a specific stat
 * @param {Object} natureData - Nature object with stat multipliers
 * @param {string} stat - Stat abbreviation (atk, def, spa, spd, spe)
 */
const getNatureMultiplier = (natureData, stat) => {
  if (!natureData) return 1.0;
  return natureData[stat] || 1.0;
};

/**
 * Get stat value from base stat, IV, EV, level, and nature multiplier
 * @param {number} baseStat - Base stat value
 * @param {number} iv - IV (0-31)
 * @param {number} ev - EV (0-255)
 * @param {number} level - Pokémon level
 * @param {number} natureMultiplier - Nature multiplier (1.1, 0.9, or 1.0)
 * @param {boolean} isHP - Is this HP stat?
 */
export const calculateStat = (baseStat, iv, ev, level, natureMultiplier = 1.0, isHP = false) => {
  const levelFactor = (2 * baseStat + iv + floorDivide(ev, 4)) * level;

  if (isHP) {
    // HP gets +Level+10 (not +5 — that's the non-HP stat offset)
    return floorDivide(levelFactor, 100) + level + 10;
  }

  const statValue = floorDivide(levelFactor, 100) + 5;
  return Math.floor(statValue * natureMultiplier);
};

/**
 * Get type effectiveness multiplier
 * Returns 4x, 2x, 1x, 0.5x, 0.25x, or 0x (immune)
 */
export const getTypeEffectiveness = (moveType, defenderType1, defenderType2, typeChart) => {
  // ?? not || here — a real immunity is a legitimate 0, and `0 || 1` would
  // wrongly fall back to 1 (neutral) since 0 is falsy in JS. Only an actual
  // missing chart entry (undefined) should default to neutral.
  const type1Effect = typeChart[moveType]?.[defenderType1] ?? 1;
  const type2Effect = defenderType2 ? (typeChart[moveType]?.[defenderType2] ?? 1) : 1;
  return type1Effect * type2Effect;
};

/**
 * Main damage calculation
 * @param {Object} attacker - { baseStat, iv, ev, nature, level, move, ability, item, isCritical, teraType }
 * @param {Object} defender - { baseStat, iv, ev, nature, level, ability, item, types, teraType }
 * @param {Object} fieldState - { weather, terrain, isDoublesFormat, screenActive, etc }
 * @param {Object} typeChart - Type effectiveness chart
 * @returns {Object} - { minDamage, maxDamage, damageRange, koChance }
 */
export const calculateDamage = (
  attacker,
  defender,
  fieldState = {},
  typeChart = {}
) => {
  // Extract stats
  const attackerLevel = attacker.level || 50;
  const defenderLevel = defender.level || 50;

  // Note: no level-doubling for crits here — that was the old Gen 1-5
  // mechanic. Gen 6+ (which Champions follows) uses a flat 1.5x multiplier
  // applied as its own step later in the pipeline, not baked into this term.
  const moveType = attacker.move?.type || 'Normal';
  const moveCategory = attacker.move?.category || 'Physical'; // Physical, Special, Status

  if (moveCategory === 'Status') {
    return { minDamage: 0, maxDamage: 0, defenderHP: 0, rolls: [], damageRange: null, koInHits: 'N/A', koHits: null, koGuaranteed: false };
  }

  // Determine which stats we need. Normally category-based, but a handful
  // of moves override this: Body Press uses the user's own Defense instead
  // of Attack; Foul Play uses the TARGET's Attack instead of the user's own;
  // Psyshock/Psystrike/Secret Sword compare against the target's physical
  // Defense even though they're Special moves.
  const moveApiName = attacker.move?.apiName;
  const attackOverride = ATTACK_STAT_OVERRIDES[moveApiName];
  const attackStatName = attackOverride ? attackOverride.stat : (moveCategory === 'Physical' ? 'atk' : 'spa');
  // Whose stat object to actually read the attacking stat from — still the
  // attacker's own nature/EV/IV/stage for Body Press, but the DEFENDER's for
  // Foul Play (item/ability damage multipliers below still apply to the real
  // attacker regardless — only the raw stat VALUE is sourced differently).
  const attackStatOwner = attackOverride?.owner === 'defender' ? defender : attacker;
  const attackStatOwnerLevel = attackOverride?.owner === 'defender' ? defenderLevel : attackerLevel;

  const defenseStatName = DEFENSE_STAT_OVERRIDES[moveApiName] || (moveCategory === 'Physical' ? 'def' : 'spd');

  // Get nature multipliers
  const attackerNatureMult = getNatureMultiplier(attackStatOwner.natureData, attackStatName);
  const defenderNatureMult = getNatureMultiplier(defender.natureData, defenseStatName);

  // Get attacking stat
  let attackStat = calculateStat(
    attackStatOwner.baseStat[attackStatName],
    attackStatOwner.iv?.[attackStatName] || 31,
    attackStatOwner.ev?.[attackStatName] || 0,
    attackStatOwnerLevel,
    attackerNatureMult
  );

  // Get defending stat
  let defenseStat = calculateStat(
    defender.baseStat[defenseStatName],
    defender.iv?.[defenseStatName] || 31,
    defender.ev?.[defenseStatName] || 0,
    defenderLevel,
    defenderNatureMult
  );

  // Protosynthesis / Quark Drive: when active, boost whichever of the
  // Pokémon's own 5 non-HP stats is highest by 1.3x. Keyed off whichever
  // Pokémon actually OWNS the stat being used (attackStatOwner — normally
  // the attacker, but the defender for Foul Play) so the boost stays tied
  // to the right Pokémon's own ability, not whoever's move it ended up in.
  if (BOOSTER_ABILITIES.has(attackStatOwner.ability) && attackStatOwner.abilityActive) {
    const boostedKey = getBoostedStatKey(calculateStat, attackStatOwner.baseStat, attackStatOwner.iv, attackStatOwner.ev, attackStatOwnerLevel, attackStatOwner.natureData, getNatureMultiplier);
    if (boostedKey === attackStatName) {
      attackStat = Math.floor(attackStat * 1.3);
    }
  }
  if (BOOSTER_ABILITIES.has(defender.ability) && defender.abilityActive) {
    const boostedKey = getBoostedStatKey(calculateStat, defender.baseStat, defender.iv, defender.ev, defenderLevel, defender.natureData, getNatureMultiplier);
    if (boostedKey === defenseStatName) {
      defenseStat = Math.floor(defenseStat * 1.3);
    }
  }

  // Handle stat stage changes. Critical hits ignore unfavorable stages:
  // a negative attacker offensive stage, and a positive defender
  // defensive stage, are both treated as 0 on a crit.
  const attackerHasMoldBreaker = hasMoldBreaker(attacker.ability);
  const isCritHit = !!attacker.isCritical && !isCritBlocked(defender.ability, attackerHasMoldBreaker);
  let attackerStage = attackStatOwner.statStages?.[attackStatName] ?? 0;
  let defenderStage = defender.statStages?.[defenseStatName] ?? 0;
  if (isCritHit) {
    if (attackerStage < 0) attackerStage = 0;
    if (defenderStage > 0) defenderStage = 0;
  }
  attackStat = applyStatStage(attackStat, attackerStage);
  defenseStat = applyStatStage(defenseStat, defenderStage);

  // Cap at 255 (both divided by 4 if either exceeds)
  if (attackStat > 255 || defenseStat > 255) {
    attackStat = floorDivide(attackStat, 4);
    defenseStat = floorDivide(defenseStat, 4);
  }

  // Effective Speed for both sides — only needed by Electro Ball/Gyro Ball,
  // but cheap enough to always compute rather than gate on move identity.
  // Tailwind doubles it for whichever side has it active.
  let attackerSpeed = applyStatStage(
    calculateStat(
      attacker.baseStat.spe,
      attacker.iv?.spe ?? 31,
      attacker.ev?.spe || 0,
      attackerLevel,
      getNatureMultiplier(attacker.natureData, 'spe')
    ),
    attacker.statStages?.spe ?? 0
  );
  if (attacker.fieldEffects?.tailwind) attackerSpeed *= 2;

  let defenderSpeed = applyStatStage(
    calculateStat(
      defender.baseStat.spe,
      defender.iv?.spe ?? 31,
      defender.ev?.spe || 0,
      defenderLevel,
      getNatureMultiplier(defender.natureData, 'spe')
    ),
    defender.statStages?.spe ?? 0
  );
  if (defender.fieldEffects?.tailwind) defenderSpeed *= 2;

  // Resolve the move's actual per-hit power(s). Most moves are a single
  // flat number; weight/speed/fainted-ally-dependent moves compute one
  // number; multi-hit moves return one power PER hit (uniform for most,
  // an escalating table for Triple Axel/Triple Kick, per-team-member base
  // Attack for Beat Up).
  const { perHitPowers } = getEffectiveMovePower(attacker.move, {
    attackerSpeed,
    defenderSpeed,
    defenderWeightKg: defender.species?.weightKg,
    attackerBaseAtk: attacker.baseStat?.atk,
    faintedAllies: attacker.move?.faintedAllies,
    hitCount: attacker.move?.hitCount,
    teamBaseAttacks: attacker.move?.teamBaseAttacks,
  });

  // STAB / type effectiveness — same for every hit, computed once
  const hasSTAB =
    attacker.types?.includes(moveType) ||
    (attacker.teraType === moveType && !attacker.types?.includes(moveType));
  const stabMultiplier = hasSTAB ? (attacker.ability === 'Adaptability' ? 2 : 1.5) : 1;

  let defenderTypes = defender.types || ['Normal', 'Normal'];
  if (defender.teraType) {
    defenderTypes = [defender.teraType];
  }
  let typeEffect = getTypeEffectiveness(moveType, defenderTypes[0], defenderTypes[1], typeChart);
  // Delta Stream and Gravity both selectively override the normal type
  // chart for specific matchups (Flying's weakness to Rock/Ice/Electric,
  // and Flying/Levitate's immunity to Ground, respectively) — apply
  // whichever one is relevant instead of the plain chart lookup.
  const deltaStreamEffect = getDeltaStreamAdjustedTypeEffect(moveType, defenderTypes, typeChart);
  if (deltaStreamEffect != null && fieldState.weather === 'Delta Stream') {
    typeEffect = deltaStreamEffect;
  }
  const gravityEffect = getGravityAdjustedTypeEffect(moveType, defenderTypes, typeChart, fieldState.gravity);
  if (gravityEffect != null) {
    typeEffect = gravityEffect;
  }

  // Grounding — determines whether Grassy/Electric/Psychic Terrain's power
  // boost applies to the attacker, and whether Misty Terrain's Dragon
  // reduction applies to the defender. Gravity grounds everyone.
  const attackerGrounded = isGrounded(attacker, fieldState.gravity);
  const defenderGrounded = isGrounded(defender, fieldState.gravity);

  // Ability-based full immunities (Water Absorb, Levitate, Wonder Guard, ...),
  // priority-blocking abilities (Armor Tail/Dazzling/Queenly Majesty), and
  // extreme-weather move-type nullification (Desolate Land blocks Water,
  // Primordial Sea blocks Fire) — all mean the move does 0 damage outright.
  // Mold Breaker-class attackers bypass the ability-based ones (not the
  // weather one — that's not an ability effect).
  const abilityBlocksMove =
    isTypeImmune(defender.ability, moveType, typeEffect, attackerHasMoldBreaker, fieldState.gravity) ||
    isPriorityBlocked(defender.ability, attacker.move?.priority, attackerHasMoldBreaker);
  const weatherBlocksMove = isWeatherBlocked(fieldState.weather, moveType);
  const moveBlocked = abilityBlocksMove || weatherBlocksMove;

  // Flat damage-reduction abilities (Multiscale, Filter/Solid Rock/Prism
  // Armor, Thick Fat, Heatproof, Dry Skin's Fire weakness) — combine
  // multiplicatively with everything else in the per-roll loop below.
  const defensiveAbilityMultiplier = moveBlocked
    ? 1
    : getDefensiveDamageMultiplier(defender.ability, moveType, typeEffect, attackerHasMoldBreaker);

  // Screens (Light Screen/Reflect/Aurora Veil) protecting the defender's
  // side, and Helping Hand boosting the attacker's side — both per-side
  // field conditions carried on each Pokémon's own fieldEffects.
  const screenMultiplier = getScreenMultiplier(defender.fieldEffects, moveCategory, fieldState.isDoublesFormat, attacker.move?.targetsMultiple);
  const helpingHandMultiplier = getHelpingHandMultiplier(attacker.fieldEffects);

  // Compute all 16 discrete damage rolls (random 85%-100%, applied first,
  // then STAB -> type -> item -> ability, each floored in sequence —
  // matching in-game modifier order rather than a min/max shortcut).
  // For multi-hit moves, EACH hit runs this entire pipeline independently
  // with its own power and its own flooring, then hits are summed — NOT
  // summed-power-then-floored-once, which silently overcounts (floor(a)+
  // floor(b) <= floor(a+b) in general, so a single combined pass over-
  // estimates total damage for hits with different power, e.g. Triple Axel).
  const rolls = new Array(16).fill(0);
  if (!moveBlocked) {
    for (const hitPower of perHitPowers) {
      // Core formula: ((2 * Level / 5 + 2) * Power * A/D / 50 + 2) — no
      // crit term here (Gen 6+); the crit multiplier is applied below instead.
      const levelFactor = floorDivide(2 * attackerLevel, 5);
      const baseCalc = floorDivide(
        floorDivide((levelFactor + 2) * hitPower * attackStat, defenseStat),
        50
      );
      let preRollDamage = baseCalc + 2;

      // Field-wide modifiers that apply BEFORE the random roll — same for
      // every hit of the same move within one turn
      if (fieldState.isDoublesFormat && attacker.move?.targetsMultiple) {
        // Real multi-target reduction is 3072/4096 (=0.75), round-half-up —
        // NOT a plain floor(x * 0.75), which under-rounds by 1 in many cases
        preRollDamage = roundDivide4096(preRollDamage, 3072);
      }
      preRollDamage = applyWeatherModifier(preRollDamage, moveType, fieldState.weather);
      if (isCritHit) {
        // Gen 6+ critical hit: flat 1.5x — plain floor, NOT the round-half-up
        // convention used by the multi-target reduction above. Verified against
        // a real matchup: floor(81*1.5)=121 matches the reference exactly,
        // while round-half-up(81, 6144/4096)=122 does not.
        preRollDamage = Math.floor(preRollDamage * 1.5);
      }
      if (attackerGrounded) {
        preRollDamage = applyTerrainModifier(preRollDamage, moveType, fieldState.terrain);
      }
      preRollDamage = applyRuinModifier(preRollDamage, defender.ability);
      preRollDamage = Math.max(1, Math.floor(preRollDamage));

      for (let i = 0; i < 16; i++) {
        const rollPercent = 85 + i;
        let d = floorDivide(preRollDamage * rollPercent, 100);
        d = Math.floor(d * stabMultiplier);
        d = Math.floor(d * typeEffect);
        if (defenderGrounded) {
          d = applyMistyTerrainModifier(d, moveType, fieldState.terrain);
        }
        d = applyItemModifier(d, attacker.item, moveCategory);
        d = applyAbilityModifier(d, attacker.ability, moveType);
        d = Math.floor(d * defensiveAbilityMultiplier);
        d = Math.floor(d * screenMultiplier);
        d = Math.floor(d * helpingHandMultiplier);
        // The "at least 1 damage" floor should NOT apply to true immunities —
        // typeEffect === 0 means 0 damage, full stop, not 1.
        d = typeEffect === 0 ? 0 : Math.max(1, Math.floor(d));
        rolls[i] += d;
      }
    }
  }

  const minDamage = rolls[0];
  const maxDamage = rolls[rolls.length - 1];

  // Get defender HP
  const defenderHP = calculateStat(
    defender.baseStat.hp,
    defender.iv?.hp ?? 31,
    defender.ev?.hp || 0,
    defenderLevel,
    1.0,
    true
  );

  // Calculate min and max as % of defender HP — floored to 1 decimal, not
  // rounded (toFixed rounds to nearest, so 93.96% would wrongly show as
  // 94.0%; other calculators truncate, so we match that: 93.9%)
  const floorPercent = (value) => (Math.floor(value * 10) / 10).toFixed(1);
  const damageRange = {
    min: minDamage,
    max: maxDamage,
    minPercent: floorPercent((minDamage / defenderHP) * 100),
    maxPercent: floorPercent((maxDamage / defenderHP) * 100),
  };

  // Determine KO description: "guaranteed" if even the worst roll KOs in
  // that many hits, "possible" if only some rolls do (matches the wording
  // real calculators use, e.g. "guaranteed 2HKO" / "possible 8HKO")
  let koHits = null;
  let koGuaranteed = false;
  for (let hits = 1; hits <= 16; hits++) {
    if (maxDamage * hits >= defenderHP) {
      koHits = hits;
      koGuaranteed = minDamage * hits >= defenderHP;
      break;
    }
  }
  const koInHits = koHits
    ? `${koGuaranteed ? 'guaranteed' : 'possible'} ${koHits === 1 ? 'OHKO' : koHits + 'HKO'}`
    : 'Never';

  return {
    minDamage,
    maxDamage,
    defenderHP,
    rolls,
    damageRange,
    koInHits,
    koHits,
    koGuaranteed,
  };
};

/**
 * Apply stat stage multipliers
 * Stage -6 to +6, each ±1 is ×2/3 or ×3/2
 */
export const applyStatStage = (stat, stage) => {
  if (stage > 0) {
    return Math.floor((stat * (stage + 2)) / 2);
  } else if (stage < 0) {
    return Math.floor((stat * 2) / (2 - stage));
  }
  return stat;
};

/**
 * Apply item modifiers
 */
const applyItemModifier = (damage, item, moveCategory) => {
  const itemMultipliers = {
    'Life Orb': 1.3,
    'Choice Specs': moveCategory === 'Special' ? 1.5 : 1,
    'Choice Band': moveCategory === 'Physical' ? 1.5 : 1,
    'Assault Vest': 1, // Defensive
    'Metronome': 1, // Complex interaction, skip for now
  };
  return Math.floor(damage * (itemMultipliers[item] || 1));
};

/**
 * Apply ability modifiers
 */
const applyAbilityModifier = (damage, ability, moveType) => {
  const abilityMultipliers = {
    'Technician': 1.5, // Moves 60 BP or lower
    'Huge Power': 2,
    'Pure Power': 2,
    'Adaptability': 1, // Already handled in STAB
    'Sheer Force': 1.3, // If move has secondary effect
  };
  return Math.floor(damage * (abilityMultipliers[ability] || 1));
};

/**
 * Apply weather modifiers. Includes the three "extreme" weathers from
 * Primal Reversion / Mega Rayquaza — Desolate Land and Primordial Sea boost
 * Fire/Water the same way their normal counterparts do (see
 * isWeatherBlocked below for the "opposing type fails outright" part,
 * handled separately since that's not a simple multiplier).
 */
const applyWeatherModifier = (damage, moveType, weather) => {
  const weatherMult = {
    'Harsh Sunlight': moveType === 'Fire' ? 1.5 : moveType === 'Water' ? 0.5 : 1,
    'Rain': moveType === 'Water' ? 1.5 : moveType === 'Fire' ? 0.5 : 1,
    'Desolate Land': moveType === 'Fire' ? 1.5 : 1, // Water's 0.5x doesn't apply — it fails outright instead
    'Primordial Sea': moveType === 'Water' ? 1.5 : 1, // Fire's 0.5x doesn't apply — it fails outright instead
    'Sandstorm': 1, // Affects Special Defense, not damage
    'Hail': 1,
  };
  return Math.floor(damage * (weatherMult[weather] || 1));
};

/**
 * Desolate Land / Primordial Sea don't just weaken the opposing type — they
 * make it fail completely (0 damage), same treatment as a type immunity.
 */
const isWeatherBlocked = (weather, moveType) => {
  if (weather === 'Desolate Land' && moveType === 'Water') return true;
  if (weather === 'Primordial Sea' && moveType === 'Fire') return true;
  return false;
};

/**
 * Whether a Pokémon is grounded — matters for terrain (only affects
 * grounded Pokémon) and for Ground-type move immunity. Gravity grounds
 * everything regardless of type or ability.
 */
const isGrounded = (pokemon, gravityActive) => {
  if (gravityActive) return true;
  if (pokemon?.ability === 'Levitate') return false;
  if (pokemon?.types?.includes('Flying')) return false;
  return true;
};

/**
 * Delta Stream (Mega Rayquaza's ability / weather) neutralizes Flying-types'
 * weakness to Rock/Ice/Electric specifically — those hits become neutral
 * against the Flying part of a type combo, while any other type the
 * defender has is unaffected.
 */
const getDeltaStreamAdjustedTypeEffect = (moveType, defenderTypes, typeChart) => {
  if (!['Rock', 'Ice', 'Electric'].includes(moveType)) return null;
  if (!defenderTypes.includes('Flying')) return null;
  let effect = 1;
  defenderTypes.forEach((t) => {
    if (t === 'Flying') return; // neutralized — contributes 1x, i.e. skip
    effect *= typeChart[moveType]?.[t] ?? 1;
  });
  return effect;
};

/**
 * Gravity grounds Flying-types and Levitate users, removing their immunity
 * to Ground-type moves. Only Ground moves are affected — everything else
 * about their typing/ability stays the same.
 */
const getGravityAdjustedTypeEffect = (moveType, defenderTypes, typeChart, gravityActive) => {
  if (!gravityActive || moveType !== 'Ground' || !defenderTypes.includes('Flying')) return null;
  let effect = 1;
  defenderTypes.forEach((t) => {
    if (t === 'Flying') return; // grounded by Gravity — no longer immune, contributes 1x here
    effect *= typeChart[moveType]?.[t] ?? 1;
  });
  return effect;
};

/**
 * Apply terrain modifiers — only affects GROUNDED Pokémon (checked by the
 * caller before calling this, via isGrounded). Grassy/Electric/Psychic
 * Terrain boost the attacker's matching-type moves; Misty Terrain instead
 * halves Dragon-type damage taken by a grounded defender (handled by a
 * separate function below since it's defender-side, not attacker-side).
 */
const applyTerrainModifier = (damage, moveType, terrain) => {
  const terrainMult = {
    'Grassy Terrain': moveType === 'Grass' ? 1.5 : 1,
    'Electric Terrain': moveType === 'Electric' ? 1.5 : 1,
    'Psychic Terrain': moveType === 'Psychic' ? 1.5 : 1,
  };
  return Math.floor(damage * (terrainMult[terrain] || 1));
};

/** Misty Terrain halves Dragon-type damage against a grounded defender. */
const applyMistyTerrainModifier = (damage, moveType, terrain) => {
  if (terrain === 'Misty Terrain' && moveType === 'Dragon') {
    return Math.floor(damage * 0.5);
  }
  return damage;
};

/**
 * Light Screen / Reflect / Aurora Veil — halve damage of the category they
 * cover, or 2732/4096 (round-half-up, weaker reduction) instead of a flat
 * half when a spread move hits multiple targets in Doubles. Not verified
 * against a real number the way the multi-target reduction was — this is
 * the documented mechanic, but flagging the rounding specifically as
 * best-effort rather than confirmed.
 */
const getScreenMultiplier = (defenderFieldEffects, moveCategory, isDoublesFormat, movetargetsMultiple) => {
  if (!defenderFieldEffects) return 1;
  const covered =
    defenderFieldEffects.auroraVeil ||
    (moveCategory === 'Special' && defenderFieldEffects.lightScreen) ||
    (moveCategory === 'Physical' && defenderFieldEffects.reflect);
  if (!covered) return 1;
  if (isDoublesFormat && movetargetsMultiple) {
    return 2732 / 4096; // ~0.667x — weaker reduction for a spread move hitting multiple targets in Doubles
  }
  return 0.5;
};

/** Helping Hand: flat 1.5x on the receiving attacker's damage. */
const getHelpingHandMultiplier = (attackerFieldEffects) => (attackerFieldEffects?.helpingHand ? 1.5 : 1);

/**
 * Apply Ruin ability modifiers
 */
const applyRuinModifier = (damage, defenderAbility) => {
  const ruinMult = {
    'Vessel of Ruin': 0.75, // Reduces Special Attack
    'Sword of Ruin': 0.75, // Reduces Defense
    'Tablets of Ruin': 0.75, // Reduces Attack
    'Beads of Ruin': 0.75, // Reduces Special Defense
  };
  // Only apply if ability reduces the relevant stat
  // For now, simplify: Ruin abilities reduce damage
  return Math.floor(damage * (ruinMult[defenderAbility] || 1));
};
