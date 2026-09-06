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
 * Builds the shape calculateDamage() expects from a Pokémon's state
 * object, minus the move (callers attach whichever move they're computing
 * with — a Pokémon can be the attacker in one calculation and the
 * defender in another).
 */
export const buildCombatant = (pokemon) => ({
  ...pokemon,
  baseStat: pokemon.species?.baseStats,
  types: pokemon.species?.types,
  ev: spToEv(pokemon.sp),
  natureData: pokemon.nature ? NATURES[pokemon.nature] : null,
});

export const activeMove = (pokemon) => pokemon?.moves?.[pokemon.activeMoveIndex]?.details || null;
export const activeMoveSlot = (pokemon) => pokemon?.moves?.[pokemon.activeMoveIndex] || null;

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
    .filter((slot) => slot && slot.species)
    .map((slot) => slot.species.baseStats?.atk)
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
