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
    // PokeAPI reports weight in hectograms (1 hg = 0.1 kg) — needed for
    // weight-based moves like Low Kick / Grass Knot / Heavy Slam / Heat Crash.
    weightKg: typeof data.weight === 'number' ? data.weight / 10 : null,
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
 * Species whose bare name either doesn't resolve to a form worth using on
 * its own, or hides multiple battle-relevant forms behind one name (e.g.
 * "urshifu" alone isn't a usable /pokemon/ entry — you must pick a style;
 * "basculegion" resolves to just the male form, hiding the separate female
 * variant with different stats). Not exhaustive — PokeAPI has ~30 species
 * like this; expand this list if you spot one missing.
 */
const VARIETY_OVERRIDES = {
  basculegion: ['basculegion-male', 'basculegion-female'],
  basculin: ['basculin-red-striped', 'basculin-blue-striped', 'basculin-white-striped'],
  urshifu: ['urshifu-single-strike', 'urshifu-rapid-strike'],
  zygarde: ['zygarde-10', 'zygarde-50', 'zygarde-complete'],
  necrozma: ['necrozma', 'necrozma-dusk-mane', 'necrozma-dawn-wings', 'necrozma-ultra'],
  toxtricity: ['toxtricity-amped', 'toxtricity-low-key'],
  lycanroc: ['lycanroc-midday', 'lycanroc-midnight', 'lycanroc-dusk'],
  meowstic: ['meowstic-male', 'meowstic-female'],
  indeedee: ['indeedee-male', 'indeedee-female'],
  oinkologne: ['oinkologne-male', 'oinkologne-female'],
  oricorio: ['oricorio-baile', 'oricorio-pom-pom', 'oricorio-pau', 'oricorio-sensu'],
  calyrex: ['calyrex', 'calyrex-ice', 'calyrex-shadow'],
  enamorus: ['enamorus-incarnate', 'enamorus-therian'],
  landorus: ['landorus-incarnate', 'landorus-therian'],
  thundurus: ['thundurus-incarnate', 'thundurus-therian'],
  tornadus: ['tornadus-incarnate', 'tornadus-therian'],
  giratina: ['giratina-altered', 'giratina-origin'],
  shaymin: ['shaymin-land', 'shaymin-sky'],
  deoxys: ['deoxys-normal', 'deoxys-attack', 'deoxys-defense', 'deoxys-speed'],
  wormadam: ['wormadam-plant', 'wormadam-sandy', 'wormadam-trash'],
  rotom: ['rotom', 'rotom-heat', 'rotom-wash', 'rotom-frost', 'rotom-fan', 'rotom-mow'],
  keldeo: ['keldeo-ordinary', 'keldeo-resolute'],
  meloetta: ['meloetta-aria', 'meloetta-pirouette'],
  hoopa: ['hoopa', 'hoopa-unbound'],
};

/**
 * Fetch every species PokeAPI knows (National Dex order), expanding the
 * handful with meaningful separate forms via VARIETY_OVERRIDES above.
 * This is what backs the team-slot species picker — used to be a small
 * hardcoded "Champions roster" list, now it's everything, live from the API.
 */
let allSpeciesCache = null;
let allSpeciesPromise = null;

export async function fetchAllSpeciesNames() {
  if (allSpeciesCache) return allSpeciesCache;
  if (allSpeciesPromise) return allSpeciesPromise;

  allSpeciesPromise = (async () => {
    const res = await fetch(`${POKEAPI_BASE}/pokemon-species?limit=1500`);
    if (!res.ok) {
      allSpeciesPromise = null;
      throw new Error(`PokeAPI: couldn't fetch species list (status ${res.status})`);
    }
    const data = await res.json();
    const slugs = [];
    data.results.forEach((s) => {
      const override = VARIETY_OVERRIDES[s.name];
      if (override) {
        slugs.push(...override);
      } else {
        slugs.push(s.name);
      }
    });
    allSpeciesCache = slugs;
    return slugs;
  })();

  return allSpeciesPromise;
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
    // Multi-hit moves (Dual Wingbeat, Surging Strikes, Bullet Seed, etc.)
    // report a min/max hit count here. null/null means single-hit.
    minHits: data.meta?.min_hits ?? null,
    maxHits: data.meta?.max_hits ?? null,
  };

  moveCache.set(moveApiName, result);
  return result;
}
