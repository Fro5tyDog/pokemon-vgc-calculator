import { NATURES } from '../data/gameData';

// SP (0-32 per stat) maps onto the classic EV formula as EV = SP * 8.
// This divides out evenly at level 50, so damageCalculator.js needs no
// changes for Champions' Stat Point system — only this conversion.
export const spToEv = (sp) =>
  Object.fromEntries(Object.entries(sp).map(([stat, value]) => [stat, value * 8]));

/**
 * Builds the shape calculateDamage() expects from a PokemonPanel's state
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

export const activeMove = (pokemon) => pokemon.moves[pokemon.activeMoveIndex]?.details || null;
