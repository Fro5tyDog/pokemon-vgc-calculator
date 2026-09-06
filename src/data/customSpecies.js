/**
 * Species data for forms that don't exist on PokeAPI yet — currently, the
 * brand-new Mega Evolutions introduced in Pokémon Legends: Z-A. PokeAPI is
 * community-maintained and hasn't caught up to this content, so these are
 * hand-entered here instead of fetched.
 *
 * Stats/types verified directly from serebii.net/legendsz-a/megaevolutions.shtml
 * (cross-checked against independent sources for Dragonite specifically, exact
 * match). IMPORTANT: Legends: Z-A itself has NO conventional ability system —
 * per Serebii's own passive-effects page, abilities for these forms are only
 * being decided for Pokémon Champions and aren't confirmed yet. So every entry
 * below has stats/types you can trust, but `abilities: []` (empty) except
 * Dragonite, whose Multiscale was independently cross-verified elsewhere.
 * Fill in an ability array once Champions actually confirms one — don't guess.
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
  'raichu-mega-za-x': {
    name: 'Mega Raichu X',
    apiName: 'raichu-mega-za-x',
    types: ['Electric'],
    baseStats: { hp: 60, atk: 135, def: 95, spa: 90, spd: 95, spe: 110 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'raichu-mega-za-y': {
    name: 'Mega Raichu Y',
    apiName: 'raichu-mega-za-y',
    types: ['Electric'],
    baseStats: { hp: 60, atk: 100, def: 55, spa: 160, spd: 80, spe: 130 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'clefable-mega-za': {
    name: 'Mega Clefable',
    apiName: 'clefable-mega-za',
    types: ['Fairy', 'Flying'],
    baseStats: { hp: 95, atk: 80, def: 93, spa: 135, spd: 110, spe: 70 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'victreebel-mega-za': {
    name: 'Mega Victreebel',
    apiName: 'victreebel-mega-za',
    types: ['Grass', 'Poison'],
    baseStats: { hp: 80, atk: 125, def: 85, spa: 135, spd: 95, spe: 70 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'starmie-mega-za': {
    name: 'Mega Starmie',
    apiName: 'starmie-mega-za',
    types: ['Water', 'Psychic'],
    baseStats: { hp: 60, atk: 140, def: 105, spa: 130, spd: 105, spe: 120 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'meganium-mega-za': {
    name: 'Mega Meganium',
    apiName: 'meganium-mega-za',
    types: ['Grass', 'Fairy'],
    baseStats: { hp: 80, atk: 92, def: 115, spa: 143, spd: 115, spe: 80 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'feraligatr-mega-za': {
    name: 'Mega Feraligatr',
    apiName: 'feraligatr-mega-za',
    types: ['Water', 'Dragon'],
    baseStats: { hp: 85, atk: 160, def: 125, spa: 89, spd: 93, spe: 78 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'skarmory-mega-za': {
    name: 'Mega Skarmory',
    apiName: 'skarmory-mega-za',
    types: ['Steel', 'Flying'],
    baseStats: { hp: 65, atk: 140, def: 110, spa: 40, spd: 100, spe: 110 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'chimecho-mega-za': {
    name: 'Mega Chimecho',
    apiName: 'chimecho-mega-za',
    types: ['Psychic', 'Steel'],
    baseStats: { hp: 75, atk: 50, def: 110, spa: 135, spd: 120, spe: 65 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'absol-mega-za-z': {
    name: 'Mega Absol Z',
    apiName: 'absol-mega-za-z',
    types: ['Dark', 'Ghost'],
    baseStats: { hp: 65, atk: 154, def: 60, spa: 75, spd: 60, spe: 151 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'staraptor-mega-za': {
    name: 'Mega Staraptor',
    apiName: 'staraptor-mega-za',
    types: ['Fighting', 'Flying'],
    baseStats: { hp: 85, atk: 140, def: 100, spa: 60, spd: 90, spe: 110 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'garchomp-mega-za-z': {
    name: 'Mega Garchomp Z',
    apiName: 'garchomp-mega-za-z',
    types: ['Dragon'],
    baseStats: { hp: 108, atk: 130, def: 85, spa: 141, spd: 85, spe: 151 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'lucario-mega-za-z': {
    name: 'Mega Lucario Z',
    apiName: 'lucario-mega-za-z',
    types: ['Fighting', 'Steel'],
    baseStats: { hp: 70, atk: 100, def: 70, spa: 164, spd: 70, spe: 151 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'froslass-mega-za': {
    name: 'Mega Froslass',
    apiName: 'froslass-mega-za',
    types: ['Ice', 'Ghost'],
    baseStats: { hp: 70, atk: 80, def: 70, spa: 140, spd: 100, spe: 120 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'heatran-mega-za': {
    name: 'Mega Heatran',
    apiName: 'heatran-mega-za',
    types: ['Fire', 'Steel'],
    baseStats: { hp: 91, atk: 120, def: 106, spa: 175, spd: 141, spe: 67 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'darkrai-mega-za': {
    name: 'Mega Darkrai',
    apiName: 'darkrai-mega-za',
    types: ['Dark'],
    baseStats: { hp: 70, atk: 120, def: 130, spa: 165, spd: 130, spe: 85 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'emboar-mega-za': {
    name: 'Mega Emboar',
    apiName: 'emboar-mega-za',
    types: ['Fire', 'Fighting'],
    baseStats: { hp: 110, atk: 148, def: 75, spa: 110, spd: 110, spe: 75 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'excadrill-mega-za': {
    name: 'Mega Excadrill',
    apiName: 'excadrill-mega-za',
    types: ['Ground', 'Steel'],
    baseStats: { hp: 110, atk: 165, def: 100, spa: 65, spd: 65, spe: 103 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'scolipede-mega-za': {
    name: 'Mega Scolipede',
    apiName: 'scolipede-mega-za',
    types: ['Bug', 'Poison'],
    baseStats: { hp: 60, atk: 140, def: 149, spa: 75, spd: 99, spe: 62 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'scrafty-mega-za': {
    name: 'Mega Scrafty',
    apiName: 'scrafty-mega-za',
    types: ['Dark', 'Fighting'],
    baseStats: { hp: 65, atk: 130, def: 135, spa: 55, spd: 135, spe: 68 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'eelektross-mega-za': {
    name: 'Mega Eelektross',
    apiName: 'eelektross-mega-za',
    types: ['Electric'],
    baseStats: { hp: 85, atk: 145, def: 80, spa: 135, spd: 90, spe: 80 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'chandelure-mega-za': {
    name: 'Mega Chandelure',
    apiName: 'chandelure-mega-za',
    types: ['Ghost', 'Fire'],
    baseStats: { hp: 60, atk: 75, def: 110, spa: 175, spd: 110, spe: 90 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'golurk-mega-za': {
    name: 'Mega Golurk',
    apiName: 'golurk-mega-za',
    types: ['Ground', 'Ghost'],
    baseStats: { hp: 89, atk: 159, def: 105, spa: 70, spd: 105, spe: 55 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'chesnaught-mega-za': {
    name: 'Mega Chesnaught',
    apiName: 'chesnaught-mega-za',
    types: ['Grass', 'Fighting'],
    baseStats: { hp: 88, atk: 137, def: 172, spa: 74, spd: 115, spe: 44 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'delphox-mega-za': {
    name: 'Mega Delphox',
    apiName: 'delphox-mega-za',
    types: ['Fire', 'Psychic'],
    baseStats: { hp: 75, atk: 69, def: 72, spa: 159, spd: 125, spe: 134 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'greninja-mega-za': {
    name: 'Mega Greninja',
    apiName: 'greninja-mega-za',
    types: ['Water', 'Dark'],
    baseStats: { hp: 72, atk: 125, def: 77, spa: 133, spd: 81, spe: 142 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'pyroar-mega-za': {
    name: 'Mega Pyroar',
    apiName: 'pyroar-mega-za',
    types: ['Fire', 'Normal'],
    baseStats: { hp: 86, atk: 88, def: 92, spa: 129, spd: 86, spe: 126 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'floette-mega-za': {
    name: 'Mega Floette',
    apiName: 'floette-mega-za',
    types: ['Fairy'],
    baseStats: { hp: 74, atk: 85, def: 87, spa: 155, spd: 148, spe: 102 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'meowstic-mega-za': {
    name: 'Mega Meowstic',
    apiName: 'meowstic-mega-za',
    types: ['Psychic'],
    baseStats: { hp: 74, atk: 48, def: 76, spa: 143, spd: 101, spe: 124 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'malamar-mega-za': {
    name: 'Mega Malamar',
    apiName: 'malamar-mega-za',
    types: ['Dark', 'Psychic'],
    baseStats: { hp: 86, atk: 102, def: 88, spa: 98, spd: 120, spe: 88 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'barbaracle-mega-za': {
    name: 'Mega Barbaracle',
    apiName: 'barbaracle-mega-za',
    types: ['Rock', 'Fighting'],
    baseStats: { hp: 72, atk: 140, def: 130, spa: 64, spd: 106, spe: 88 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'dragalge-mega-za': {
    name: 'Mega Dragalge',
    apiName: 'dragalge-mega-za',
    types: ['Poison', 'Dragon'],
    baseStats: { hp: 65, atk: 85, def: 105, spa: 132, spd: 163, spe: 44 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'hawlucha-mega-za': {
    name: 'Mega Hawlucha',
    apiName: 'hawlucha-mega-za',
    types: ['Fighting', 'Flying'],
    baseStats: { hp: 78, atk: 137, def: 100, spa: 74, spd: 93, spe: 118 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'zygarde-mega-za': {
    name: 'Mega Zygarde',
    apiName: 'zygarde-mega-za',
    types: ['Dragon', 'Ground'],
    baseStats: { hp: 216, atk: 70, def: 91, spa: 216, spd: 85, spe: 100 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'crabominable-mega-za': {
    name: 'Mega Crabominable',
    apiName: 'crabominable-mega-za',
    types: ['Fighting', 'Ice'],
    baseStats: { hp: 97, atk: 157, def: 122, spa: 62, spd: 107, spe: 33 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'golisopod-mega-za': {
    name: 'Mega Golisopod',
    apiName: 'golisopod-mega-za',
    types: ['Bug', 'Steel'],
    baseStats: { hp: 75, atk: 150, def: 175, spa: 70, spd: 120, spe: 40 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'drampa-mega-za': {
    name: 'Mega Drampa',
    apiName: 'drampa-mega-za',
    types: ['Normal', 'Dragon'],
    baseStats: { hp: 78, atk: 85, def: 110, spa: 160, spd: 116, spe: 36 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'magearna-mega-za': {
    name: 'Mega Magearna',
    apiName: 'magearna-mega-za',
    types: ['Steel', 'Fairy'],
    baseStats: { hp: 80, atk: 125, def: 115, spa: 170, spd: 115, spe: 95 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'zeraora-mega-za': {
    name: 'Mega Zeraora',
    apiName: 'zeraora-mega-za',
    types: ['Electric'],
    baseStats: { hp: 88, atk: 157, def: 75, spa: 147, spd: 80, spe: 153 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'falinks-mega-za': {
    name: 'Mega Falinks',
    apiName: 'falinks-mega-za',
    types: ['Fighting'],
    baseStats: { hp: 65, atk: 135, def: 135, spa: 70, spd: 65, spe: 100 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'scovillain-mega-za': {
    name: 'Mega Scovillain',
    apiName: 'scovillain-mega-za',
    types: ['Grass', 'Fire'],
    baseStats: { hp: 65, atk: 138, def: 85, spa: 138, spd: 85, spe: 75 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'glimmora-mega-za': {
    name: 'Mega Glimmora',
    apiName: 'glimmora-mega-za',
    types: ['Rock', 'Poison'],
    baseStats: { hp: 83, atk: 90, def: 105, spa: 150, spd: 96, spe: 101 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'tatsugiri-mega-za': {
    name: 'Mega Tatsugiri',
    apiName: 'tatsugiri-mega-za',
    types: ['Dragon', 'Water'],
    baseStats: { hp: 68, atk: 65, def: 90, spa: 135, spd: 125, spe: 92 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
  },
  'baxcalibur-mega-za': {
    name: 'Mega Baxcalibur',
    apiName: 'baxcalibur-mega-za',
    types: ['Dragon', 'Ice'],
    baseStats: { hp: 115, atk: 175, def: 117, spa: 105, spd: 101, spe: 87 },
    weightKg: null,
    sprite: '',
    abilities: [], // not confirmed for Champions yet
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
