/**
 * PokeAPI integration layer.
 * Fetches Pokémon and move data directly from https://pokeapi.co at runtime.
 *
 * - fetchPokemon() gets types/stats/sprite/abilities for a species.
 * - fetchAllMoveNames() gets the full move list once per session (for the
 *   move picker dropdown — every move, not just ones a given species learns).
 * - fetchMoveDetails() is called lazily for whichever move the user selects,
 *   since PokeAPI doesn't return power/type/category in bulk.
 *
 * All three are cached in-memory for the session.
 */

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

const pokemonCache = new Map();
const moveCache = new Map();

const toTitleCase = (str) =>
  str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

// PokeAPI stat slugs -> the short keys the rest of the app uses
const STAT_KEY_MAP = {
  hp: 'hp',
  attack: 'atk',
  defense: 'def',
  'special-attack': 'spa',
  'special-defense': 'spd',
  speed: 'spe',
};

/**
 * Fetch a Pokémon's types, base stats, sprite, abilities, and move list.
 * @param {string} speciesSlug - PokeAPI slug, e.g. "basculegion", "landorus-therian"
 */
export async function fetchPokemon(speciesSlug) {
  const key = speciesSlug.toLowerCase();

  if (pokemonCache.has(key)) {
    return pokemonCache.get(key);
  }

  const res = await fetch(`${POKEAPI_BASE}/pokemon/${key}`);
  if (!res.ok) {
    throw new Error(`PokeAPI: couldn't find Pokémon "${speciesSlug}" (status ${res.status})`);
  }
  const data = await res.json();

  const baseStats = {};
  data.stats.forEach((s) => {
    const mapped = STAT_KEY_MAP[s.stat.name];
    if (mapped) baseStats[mapped] = s.base_stat;
  });

  const result = {
    name: toTitleCase(data.name),
    apiName: data.name,
    types: data.types
      .sort((a, b) => a.slot - b.slot)
      .map((t) => toTitleCase(t.type.name)),
    baseStats,
    sprite:
      data.sprites?.other?.['official-artwork']?.front_default ||
      data.sprites?.front_default ||
      '',
    abilities: data.abilities.map((a) => ({
      name: toTitleCase(a.ability.name),
      apiName: a.ability.name,
      isHidden: a.is_hidden,
    })),
  };

  pokemonCache.set(key, result);
  return result;
}

/**
 * Fetch the full list of move names PokeAPI knows about (name + slug only —
 * cheap, no per-move detail). Fetched once per session and cached; full
 * details for a specific move are still fetched lazily via fetchMoveDetails
 * once the user actually picks one.
 */
let allMovesCache = null;
let allMovesPromise = null;

export async function fetchAllMoveNames() {
  if (allMovesCache) return allMovesCache;
  if (allMovesPromise) return allMovesPromise;

  allMovesPromise = (async () => {
    const res = await fetch(`${POKEAPI_BASE}/move?limit=2000`);
    if (!res.ok) {
      allMovesPromise = null;
      throw new Error(`PokeAPI: couldn't fetch move list (status ${res.status})`);
    }
    const data = await res.json();
    const list = data.results
      .map((m) => ({ name: toTitleCase(m.name), apiName: m.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    allMovesCache = list;
    return list;
  })();

  return allMovesPromise;
}

/**
 * Fetch full battle-relevant details for a single move (power/type/category/accuracy).
 * Cached, since many Pokémon share the same moves.
 * @param {string} moveApiName - PokeAPI slug, e.g. "close-combat"
 */
export async function fetchMoveDetails(moveApiName) {
  if (moveCache.has(moveApiName)) {
    return moveCache.get(moveApiName);
  }

  const res = await fetch(`${POKEAPI_BASE}/move/${moveApiName}`);
  if (!res.ok) {
    throw new Error(`PokeAPI: couldn't find move "${moveApiName}" (status ${res.status})`);
  }
  const data = await res.json();

  const result = {
    name: toTitleCase(data.name),
    apiName: data.name,
    type: toTitleCase(data.type?.name || 'normal'),
    // "physical" | "special" | "status" -> "Physical" | "Special" | "Status"
    category: toTitleCase(data.damage_class?.name || 'physical'),
    basePower: data.power || 0,
    accuracy: data.accuracy || 100,
    // PokeAPI's target field tells us if this move hits multiple Pokémon at
    // once ("all-other-pokemon" e.g. Earthquake/Discharge — hits allies too;
    // "all-opponents" e.g. Rock Slide/Heat Wave/Surf — opponents only).
    // That's exactly what the Doubles spread-move damage reduction needs.
    targetsMultiple: ['all-other-pokemon', 'all-opponents'].includes(data.target?.name),
  };

  moveCache.set(moveApiName, result);
  return result;
}
