import { NATURES } from '../data/gameData';

export const FIXED_IV = 31; // Champions: every Pokémon is treated as perfect IVs
export const FIXED_LEVEL = 50; // Champions: all battles are Lv. 50
export const MOVE_SLOT_COUNT = 4;
export const TEAM_SIZE = 6;

// SP (0-32 per stat) maps onto the classic EV formula as EV = SP * 8.
// This divides out evenly at level 50, so damageCalculator.js needs no
// changes for Champions' Stat Point system — only this conversion.
export const spToEv = (sp) =>
  Object.fromEntries(Object.entries(sp).map(([stat, value]) => [stat, value * 8]));

/**
 * Which species data to actually use — the Mega form's, if one is selected
 * and its data has loaded, otherwise the base species. Used everywhere
 * species data feeds into calculations or display, so a Mega'd Pokémon's
 * stats/types/abilities/weight/sprite are all sourced consistently.
 */
export const getEffectiveSpecies = (pokemon) =>
  pokemon?.megaForm && pokemon?.megaSpecies ? pokemon.megaSpecies : pokemon?.species || null;

/**
 * Builds the shape calculateDamage() expects from a Pokémon's state
 * object, minus the move (callers attach whichever move they're computing
 * with — a Pokémon can be the attacker in one calculation and the
 * defender in another).
 */
export const buildCombatant = (pokemon) => {
  const effectiveSpecies = getEffectiveSpecies(pokemon);
  return {
    ...pokemon,
    species: effectiveSpecies,
    baseStat: effectiveSpecies?.baseStats,
    types: effectiveSpecies?.types,
    ev: spToEv(pokemon.sp),
    natureData: pokemon.nature ? NATURES[pokemon.nature] : null,
  };
};

export const activeMove = (pokemon) => pokemon?.moves?.[pokemon.activeMoveIndex]?.details || null;
export const activeMoveSlot = (pokemon) => pokemon?.moves?.[pokemon.activeMoveIndex] || null;

/**
 * Applies effects the OPPONENT'S ability has on this Pokémon before it's
 * used as a combatant — currently just Intimidate, which lowers this
 * Pokémon's Attack stage by 1 when the opponent has it active. Returns a
 * new object; doesn't mutate. Call with (defender, attacker) — the
 * opponent's ability is what's checked.
 */
export const withIncomingEffects = (pokemon, opponent) => {
  if (!pokemon) return pokemon;
  if (opponent?.ability === 'Intimidate' && opponent?.abilityActive) {
    const newAtkStage = Math.max(-6, (pokemon.statStages?.atk ?? 0) - 1);
    return { ...pokemon, statStages: { ...pokemon.statStages, atk: newAtkStage } };
  }
  return pokemon;
};

export const emptyMoveSlot = () => ({
  apiName: '',
  details: null,
  loading: false,
  error: null,
  isCritical: false,
  hitCount: null, // null = "use the move's default/max"
  faintedAllies: 0,
});

/**
 * A single team member's full configuration — species, moveset, stats,
 * item/ability/nature, everything the calculator needs once this slot is
 * the "active" one being used to attack or defend with.
 */
export const makeDefaultPokemon = (speciesSlug) => ({
  speciesSlug,
  species: null,
  speciesLoading: false,
  speciesError: null,
  moves: Array.from({ length: MOVE_SLOT_COUNT }, emptyMoveSlot),
  activeMoveIndex: 0,
  item: null,
  ability: null,
  nature: 'adamant',
  level: FIXED_LEVEL,
  sp: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  iv: { hp: FIXED_IV, atk: FIXED_IV, def: FIXED_IV, spa: FIXED_IV, spd: FIXED_IV, spe: FIXED_IV },
  statStages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  teraType: null,
  // Whether this Pokémon's ability is currently "triggered" — used for
  // Intimidate (lowers opponent's Attack) and Protosynthesis/Quark Drive
  // (boosts this Pokémon's own highest stat by 1.3x). Irrelevant for every
  // other ability, but one shared flag is enough since a Pokémon only has
  // one ability active at a time.
  abilityActive: false,
  // Mega Evolution — null unless the species has a mega form and the user
  // picked one. megaSpecies is the fetched form's stats/types/abilities,
  // analogous to `species` above but for whichever form is active.
  megaForm: null,
  megaSpecies: null,
  megaSpeciesLoading: false,
  megaSpeciesError: null,
});

/** A team is 6 slots; empty slots are null until a species is picked. */
export const makeTeam = () => Array.from({ length: TEAM_SIZE }, () => null);

/** A "side" (what used to be a single Pokémon) is now a roster of teams. */
export const makeInitialSide = (firstSlug) => {
  const team = makeTeam();
  team[0] = makeDefaultPokemon(firstSlug);
  return { teams: [team], activeTeamIndex: 0, activeSlotIndex: 0 };
};

/** The currently-active team member for a side, or null if that slot is empty. */
export const activePokemon = (side) => side.teams[side.activeTeamIndex][side.activeSlotIndex];

/** Base Attack of every populated slot in a side's active team (for Beat Up). */
export const activeTeamBaseAttacks = (side) =>
  side.teams[side.activeTeamIndex]
    .filter((slot) => slot && getEffectiveSpecies(slot))
    .map((slot) => getEffectiveSpecies(slot).baseStats?.atk)
    .filter((v) => v != null);

/**
 * Wraps a side's setState function into one that reads/writes only the
 * currently-active team member — lets PokemonPanel/MoveSelector keep using
 * the exact same setPokemon(updaterOrValue) calling convention they always
 * have, without knowing teams exist underneath.
 */
export const makeActiveSlotSetter = (setSide) => (updaterOrValue) => {
  setSide((prev) => {
    const { teams, activeTeamIndex, activeSlotIndex } = prev;
    const current = teams[activeTeamIndex][activeSlotIndex];
    const next = typeof updaterOrValue === 'function' ? updaterOrValue(current) : updaterOrValue;
    const newTeams = teams.map((team, ti) =>
      ti === activeTeamIndex ? team.map((slot, si) => (si === activeSlotIndex ? next : slot)) : team
    );
    return { ...prev, teams: newTeams };
  });
};
