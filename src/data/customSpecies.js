/**
 * Species data for forms that don't exist on PokeAPI yet — currently, the
 * brand-new Mega Evolutions introduced in Pokémon Legends: Z-A. PokeAPI is
 * community-maintained and hasn't caught up to this content, so these are
 * hand-entered here instead of fetched.
 *
 * IMPORTANT: only add an entry here once you have stats/types/ability from
 * at least two independent, cross-agreeing sources — do not guess. Legends:
 * Z-A introduced ~26 new Megas in the base game plus more in the Mega
 * Dimension DLC; only the one below has been verified so far. The rest can
 * be added the same way once real data is available for them.
 *
 * Verified for Mega Dragonite (cross-confirmed across 3 independent
 * sources — base stat total 700, exact stat spread, ability, and typing
 * all matched): Dragon/Flying, Multiscale, 91/124/115/145/125/100
 * (HP/Atk/Def/SpA/SpD/Spe), 290kg. Held item is "Dragoninite" per the
 * in-game naming.
 */
export const CUSTOM_SPECIES = {
  'dragonite-mega-za': {
    name: 'Mega Dragonite',
    apiName: 'dragonite-mega-za',
    types: ['Dragon', 'Flying'],
    baseStats: { hp: 91, atk: 124, def: 115, spa: 145, spd: 125, spe: 100 },
    weightKg: 290.0,
    sprite: '',
    abilities: [{ name: 'Multiscale', apiName: 'multiscale', isHidden: false }],
  },
};

/** The mega stone item name that should auto-select each custom mega form. */
export const CUSTOM_MEGA_STONE_TO_FORM = {
  dragoninite: 'dragonite-mega-za',
};

/**
 * Official mega stone item names -> their mega form slug. Naming isn't a
 * simple "+ite" pattern (Blastoisinite, Houndoominite, Sablenite, etc. all
 * have irregular insertions/truncations), so this is an explicit table
 * rather than something derived algorithmically. Used by the Showdown
 * importer to recognize "Species @ Whateverite" and auto-select the right
 * Mega Form instead of treating it as a held-item damage modifier.
 */
export const MEGA_STONE_TO_FORM = {
  venusaurite: 'venusaur-mega',
  'charizardite x': 'charizard-mega-x',
  'charizardite y': 'charizard-mega-y',
  blastoisinite: 'blastoise-mega',
  beedrillite: 'beedrill-mega',
  pidgeotite: 'pidgeot-mega',
  alakazite: 'alakazam-mega',
  slowbronite: 'slowbro-mega',
  gengarite: 'gengar-mega',
  kangaskhanite: 'kangaskhan-mega',
  pinsirite: 'pinsir-mega',
  gyaradosite: 'gyarados-mega',
  aerodactylite: 'aerodactyl-mega',
  'mewtwonite x': 'mewtwo-mega-x',
  'mewtwonite y': 'mewtwo-mega-y',
  ampharosite: 'ampharos-mega',
  steelixite: 'steelix-mega',
  scizorite: 'scizor-mega',
  heracronite: 'heracross-mega',
  houndoominite: 'houndoom-mega',
  tyranitarite: 'tyranitar-mega',
  sceptilite: 'sceptile-mega',
  blazikenite: 'blaziken-mega',
  swampertite: 'swampert-mega',
  gardevoirite: 'gardevoir-mega',
  sablenite: 'sableye-mega',
  mawilite: 'mawile-mega',
  aggronite: 'aggron-mega',
  medichamite: 'medicham-mega',
  manectite: 'manectric-mega',
  sharpedonite: 'sharpedo-mega',
  cameruptite: 'camerupt-mega',
  altarianite: 'altaria-mega',
  banettite: 'banette-mega',
  absolite: 'absol-mega',
  glalitite: 'glalie-mega',
  salamencite: 'salamence-mega',
  metagrossite: 'metagross-mega',
  latiasite: 'latias-mega',
  latiosite: 'latios-mega',
  rayquazite: 'rayquaza-mega',
  lopunnite: 'lopunny-mega',
  garchompite: 'garchomp-mega',
  lucarionite: 'lucario-mega',
  abomasite: 'abomasnow-mega',
  galladite: 'gallade-mega',
  audinite: 'audino-mega',
  diancite: 'diancie-mega',
  ...CUSTOM_MEGA_STONE_TO_FORM,
};
