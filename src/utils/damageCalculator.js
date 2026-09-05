/**
 * Pokémon Gen 9 damage calculator
 * Based on the damage formula: ((2 * Level * Critical / 5 + 2) * Power * A/D / 50 + 2) * STAB * Type1 * Type2 * random
 * All intermediate results are floored (rounded down)
 */

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
  const type1Effect = typeChart[moveType]?.[defenderType1] || 1;
  const type2Effect = defenderType2 ? typeChart[moveType]?.[defenderType2] || 1 : 1;
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

  const isCritical = attacker.isCritical ? 2 : 1;
  const movePower = attacker.move?.basePower || 1;
  const moveType = attacker.move?.type || 'Normal';
  const moveCategory = attacker.move?.category || 'Physical'; // Physical, Special, Status

  if (moveCategory === 'Status') {
    return { minDamage: 0, maxDamage: 0, defenderHP: 0, rolls: [], damageRange: null, koInHits: 'N/A', koHits: null, koGuaranteed: false };
  }

  // Determine which stats we need
  const attackStatName = moveCategory === 'Physical' ? 'atk' : 'spa';
  const defenseStatName = moveCategory === 'Physical' ? 'def' : 'spd';

  // Get nature multipliers
  const attackerNatureMult = getNatureMultiplier(attacker.natureData, attackStatName);
  const defenderNatureMult = getNatureMultiplier(defender.natureData, defenseStatName);

  // Get attacking stat (Attack or SpA)
  let attackStat = calculateStat(
    moveCategory === 'Physical' ? attacker.baseStat.atk : attacker.baseStat.spa,
    attacker.iv?.[attackStatName] || 31,
    attacker.ev?.[attackStatName] || 0,
    attackerLevel,
    attackerNatureMult
  );

  // Get defending stat (Defense or SpD)
  let defenseStat = calculateStat(
    moveCategory === 'Physical' ? defender.baseStat.def : defender.baseStat.spd,
    defender.iv?.[defenseStatName] || 31,
    defender.ev?.[defenseStatName] || 0,
    defenderLevel,
    defenderNatureMult
  );

  // Handle stat stage changes. Critical hits ignore unfavorable stages:
  // a negative attacker offensive stage, and a positive defender
  // defensive stage, are both treated as 0 on a crit.
  const isCritHit = !!attacker.isCritical;
  let attackerStage = attacker.statStages?.[attackStatName] ?? 0;
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

  // Core formula: ((2 * Level * Critical / 5 + 2) * Power * A/D / 50 + 2)
  const levelCritical = floorDivide(2 * attackerLevel * isCritical, 5);
  const baseCalc = floorDivide(
    floorDivide((levelCritical + 2) * movePower * attackStat, defenseStat),
    50
  );
  let preRollDamage = baseCalc + 2;

  // Field-wide modifiers that apply BEFORE the random roll (this ordering
  // matters: it's what produces the real game's characteristic pattern of
  // duplicate values among the 16 rolls, since later floor() steps can
  // collapse two different rolls onto the same final integer)
  if (fieldState.isDoublesFormat && attacker.move?.targetsMultiple) {
    // Real multi-target reduction is 3072/4096 (=0.75), round-half-up —
    // NOT a plain floor(x * 0.75), which under-rounds by 1 in many cases
    preRollDamage = roundDivide4096(preRollDamage, 3072);
  }
  preRollDamage = applyWeatherModifier(preRollDamage, moveType, fieldState.weather);
  preRollDamage = applyTerrainModifier(preRollDamage, moveType, fieldState.terrain, attacker.types);
  preRollDamage = applyRuinModifier(preRollDamage, defender.ability);
  preRollDamage = Math.max(1, Math.floor(preRollDamage));

  // STAB / type effectiveness — same for every roll, computed once
  const hasSTAB =
    attacker.types?.includes(moveType) ||
    (attacker.teraType === moveType && !attacker.types?.includes(moveType));
  const stabMultiplier = hasSTAB ? (attacker.ability === 'Adaptability' ? 2 : 1.5) : 1;

  let defenderTypes = defender.types || ['Normal', 'Normal'];
  if (defender.teraType) {
    defenderTypes = [defender.teraType];
  }
  const typeEffect = getTypeEffectiveness(moveType, defenderTypes[0], defenderTypes[1], typeChart);

  // Compute all 16 discrete damage rolls (random 85%-100%, applied first,
  // then STAB -> type -> item -> ability, each floored in sequence —
  // matching in-game modifier order rather than a min/max shortcut)
  const rolls = [];
  for (let rollPercent = 85; rollPercent <= 100; rollPercent++) {
    let d = floorDivide(preRollDamage * rollPercent, 100);
    d = Math.floor(d * stabMultiplier);
    d = Math.floor(d * typeEffect);
    d = applyItemModifier(d, attacker.item, moveCategory);
    d = applyAbilityModifier(d, attacker.ability, moveType);
    d = Math.max(1, Math.floor(d));
    rolls.push(d);
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

  // Calculate min and max as % of defender HP
  const damageRange = {
    min: minDamage,
    max: maxDamage,
    minPercent: ((minDamage / defenderHP) * 100).toFixed(1),
    maxPercent: ((maxDamage / defenderHP) * 100).toFixed(1),
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
 * Apply weather modifiers
 */
const applyWeatherModifier = (damage, moveType, weather) => {
  const weatherMult = {
    'Harsh Sunlight': moveType === 'Fire' ? 1.5 : moveType === 'Water' ? 0.5 : 1,
    'Rain': moveType === 'Water' ? 1.5 : moveType === 'Fire' ? 0.5 : 1,
    'Sandstorm': 1, // Affects Special Defense, not damage
    'Hail': 1,
  };
  return Math.floor(damage * (weatherMult[weather] || 1));
};

/**
 * Apply terrain modifiers
 */
const applyTerrainModifier = (damage, moveType, terrain, attackerTypes) => {
  // Terrain modifiers vary; Grassy Terrain boosts Grass moves for grounded Pokemon
  const terrainMult = {
    'Grassy Terrain': moveType === 'Grass' ? 1.5 : 1,
    'Electric Terrain': moveType === 'Electric' ? 1.5 : 1,
    'Psychic Terrain': moveType === 'Psychic' ? 1.5 : 1,
    'Misty Terrain': 1, // Defensive
  };
  return Math.floor(damage * (terrainMult[terrain] || 1));
};

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
