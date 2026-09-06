/**
 * Static reference data for Gen 9 / Champions damage calculations.
 *
 * Pokémon species, base stats, abilities, and movesets are now fetched
 * live from PokeAPI (see src/api/pokeApi.js) instead of being hardcoded
 * here — this file only holds things PokeAPI doesn't provide in a
 * battle-ready shape: natures, the type chart, and field-condition lists.
 */

export const ITEMS = {
  lifeorb: { name: 'Life Orb' },
  choiceband: { name: 'Choice Band' },
  choicespecs: { name: 'Choice Specs' },
  assaultvest: { name: 'Assault Vest' },
  mysticwater: { name: 'Mystic Water' },
  charcoal: { name: 'Charcoal' },
  lumberry: { name: 'Lum Berry' },
  sitrusberry: { name: 'Sitrus Berry' },
  focussash: { name: 'Focus Sash' },
  airballoon: { name: 'Air Balloon' },
};

export const NATURES = {
  adamant: { name: 'Adamant', atk: 1.1, spa: 0.9 },
  brave: { name: 'Brave', atk: 1.1, spe: 0.9 },
  calm: { name: 'Calm', spd: 1.1, atk: 0.9 },
  careful: { name: 'Careful', spd: 1.1, spa: 0.9 },
  jolly: { name: 'Jolly', spe: 1.1, spa: 0.9 },
  modest: { name: 'Modest', spa: 1.1, atk: 0.9 },
  naive: { name: 'Naive', spe: 1.1, spd: 0.9 },
  naughty: { name: 'Naughty', atk: 1.1, spd: 0.9 },
  bold: { name: 'Bold', def: 1.1, atk: 0.9 },
  impish: { name: 'Impish', def: 1.1, spa: 0.9 },
  timid: { name: 'Timid', spe: 1.1, atk: 0.9 },
  hardy: { name: 'Hardy' },
  bashful: { name: 'Bashful' },
  serious: { name: 'Serious' },
};

export const WEATHER_CONDITIONS = [
  'None',
  'Harsh Sunlight',
  'Rain',
  'Sandstorm',
  'Snow',
  'Desolate Land',
  'Primordial Sea',
  'Delta Stream',
];

export const TERRAIN_CONDITIONS = [
  'None',
  'Grassy Terrain',
  'Electric Terrain',
  'Psychic Terrain',
  'Misty Terrain',
];

export const TYPE_CHART = {
  Normal: { Normal: 1, Fire: 1, Water: 1, Electric: 1, Grass: 1, Ice: 1, Fighting: 2, Poison: 1, Ground: 1, Flying: 1, Psychic: 1, Bug: 1, Rock: 0.5, Ghost: 0, Dragon: 1, Dark: 1, Steel: 0.5, Fairy: 1 },
  Fire: { Normal: 1, Fire: 0.5, Water: 0.5, Electric: 1, Grass: 2, Ice: 2, Fighting: 1, Poison: 1, Ground: 1, Flying: 1, Psychic: 1, Bug: 2, Rock: 0.5, Ghost: 1, Dragon: 0.5, Dark: 1, Steel: 2, Fairy: 1 },
  Water: { Normal: 1, Fire: 2, Water: 0.5, Electric: 1, Grass: 0.5, Ice: 1, Fighting: 1, Poison: 1, Ground: 2, Flying: 1, Psychic: 1, Bug: 1, Rock: 2, Ghost: 1, Dragon: 0.5, Dark: 1, Steel: 1, Fairy: 1 },
  Electric: { Normal: 1, Fire: 1, Water: 2, Electric: 0.5, Grass: 0.5, Ice: 1, Fighting: 1, Poison: 1, Ground: 0, Flying: 2, Psychic: 1, Bug: 1, Rock: 1, Ghost: 1, Dragon: 0.5, Dark: 1, Steel: 1, Fairy: 1 },
  Grass: { Normal: 1, Fire: 0.5, Water: 2, Electric: 1, Grass: 0.5, Ice: 1, Fighting: 1, Poison: 0.5, Ground: 2, Flying: 0.5, Psychic: 1, Bug: 0.5, Rock: 2, Ghost: 1, Dragon: 0.5, Dark: 1, Steel: 0.5, Fairy: 1 },
  Ice: { Normal: 1, Fire: 0.5, Water: 0.5, Electric: 1, Grass: 2, Ice: 0.5, Fighting: 1, Poison: 1, Ground: 2, Flying: 2, Psychic: 1, Bug: 1, Rock: 1, Ghost: 1, Dragon: 2, Dark: 1, Steel: 0.5, Fairy: 1 },
  Fighting: { Normal: 2, Fire: 1, Water: 1, Electric: 1, Grass: 1, Ice: 2, Fighting: 1, Poison: 0.5, Ground: 1, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dragon: 1, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison: { Normal: 1, Fire: 1, Water: 1, Electric: 1, Grass: 2, Ice: 1, Fighting: 1, Poison: 0.5, Ground: 0.5, Flying: 1, Psychic: 2, Bug: 1, Rock: 0.5, Ghost: 0.5, Dragon: 1, Dark: 1, Steel: 0, Fairy: 2 },
  Ground: { Normal: 1, Fire: 2, Water: 1, Electric: 2, Grass: 0.5, Ice: 1, Fighting: 1, Poison: 2, Ground: 1, Flying: 0, Psychic: 1, Bug: 0.5, Rock: 2, Ghost: 1, Dragon: 1, Dark: 1, Steel: 2, Fairy: 1 },
  Flying: { Normal: 1, Fire: 1, Water: 1, Electric: 0.5, Grass: 2, Ice: 1, Fighting: 2, Poison: 1, Ground: 1, Flying: 1, Psychic: 1, Bug: 2, Rock: 0.5, Ghost: 1, Dragon: 1, Dark: 1, Steel: 0.5, Fairy: 1 },
  Psychic: { Normal: 1, Fire: 1, Water: 1, Electric: 1, Grass: 1, Ice: 1, Fighting: 2, Poison: 2, Ground: 1, Flying: 1, Psychic: 0.5, Bug: 1, Rock: 1, Ghost: 1, Dragon: 1, Dark: 0, Steel: 0.5, Fairy: 1 },
  Bug: { Normal: 1, Fire: 0.5, Water: 1, Electric: 1, Grass: 2, Ice: 1, Fighting: 0.5, Poison: 0.5, Ground: 1, Flying: 0.5, Psychic: 2, Bug: 1, Rock: 1, Ghost: 0.5, Dragon: 1, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock: { Normal: 1, Fire: 2, Water: 1, Electric: 1, Grass: 1, Ice: 2, Fighting: 0.5, Poison: 1, Ground: 0.5, Flying: 2, Psychic: 1, Bug: 2, Rock: 1, Ghost: 1, Dragon: 1, Dark: 1, Steel: 0.5, Fairy: 1 },
  Ghost: { Normal: 0, Fire: 1, Water: 1, Electric: 1, Grass: 1, Ice: 1, Fighting: 1, Poison: 1, Ground: 1, Flying: 1, Psychic: 2, Bug: 1, Rock: 1, Ghost: 2, Dragon: 1, Dark: 0.5, Steel: 1, Fairy: 1 },
  Dragon: { Normal: 1, Fire: 1, Water: 1, Electric: 1, Grass: 1, Ice: 1, Fighting: 1, Poison: 1, Ground: 1, Flying: 1, Psychic: 1, Bug: 1, Rock: 1, Ghost: 1, Dragon: 2, Dark: 1, Steel: 0.5, Fairy: 0 },
  Dark: { Normal: 1, Fire: 1, Water: 1, Electric: 1, Grass: 1, Ice: 1, Fighting: 0.5, Poison: 1, Ground: 1, Flying: 1, Psychic: 2, Bug: 0.5, Rock: 1, Ghost: 2, Dragon: 1, Dark: 0.5, Steel: 1, Fairy: 0.5 },
  Steel: { Normal: 1, Fire: 0.5, Water: 0.5, Electric: 0.5, Grass: 1, Ice: 2, Fighting: 1, Poison: 1, Ground: 1, Flying: 1, Psychic: 1, Bug: 1, Rock: 2, Ghost: 1, Dragon: 1, Dark: 1, Steel: 0.5, Fairy: 2 },
  Fairy: { Normal: 1, Fire: 0.5, Water: 1, Electric: 1, Grass: 1, Ice: 1, Fighting: 2, Poison: 0.5, Ground: 1, Flying: 1, Psychic: 1, Bug: 1, Rock: 1, Ghost: 1, Dragon: 2, Dark: 2, Steel: 0.5, Fairy: 1 },
};
