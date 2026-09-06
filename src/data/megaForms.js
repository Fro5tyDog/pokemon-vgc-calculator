/**
 * Species -> their Mega Evolution variety slug(s) on PokeAPI. Mega Evolution
 * isn't part of modern competitive formats, but this app has been leaning
 * toward comprehensive coverage over strict format-legality (see the full
 * Pokédex roster), so it's included as an option regardless.
 *
 * Not exhaustive — there are ~48 Mega-capable species across Gens 6-7;
 * this covers the commonly-referenced ones. Adding a missing one is a
 * one-line addition here (species slug -> array of its mega variety slugs).
 */
export const MEGA_FORMS = {
  venusaur: ['venusaur-mega'],
  charizard: ['charizard-mega-x', 'charizard-mega-y'],
  blastoise: ['blastoise-mega'],
  beedrill: ['beedrill-mega'],
  pidgeot: ['pidgeot-mega'],
  alakazam: ['alakazam-mega'],
  slowbro: ['slowbro-mega'],
  gengar: ['gengar-mega'],
  kangaskhan: ['kangaskhan-mega'],
  pinsir: ['pinsir-mega'],
  gyarados: ['gyarados-mega'],
  aerodactyl: ['aerodactyl-mega'],
  mewtwo: ['mewtwo-mega-x', 'mewtwo-mega-y'],
  ampharos: ['ampharos-mega'],
  steelix: ['steelix-mega'],
  scizor: ['scizor-mega'],
  heracross: ['heracross-mega'],
  houndoom: ['houndoom-mega'],
  tyranitar: ['tyranitar-mega'],
  sceptile: ['sceptile-mega'],
  blaziken: ['blaziken-mega'],
  swampert: ['swampert-mega'],
  gardevoir: ['gardevoir-mega'],
  sableye: ['sableye-mega'],
  mawile: ['mawile-mega'],
  aggron: ['aggron-mega'],
  medicham: ['medicham-mega'],
  manectric: ['manectric-mega'],
  sharpedo: ['sharpedo-mega'],
  camerupt: ['camerupt-mega'],
  altaria: ['altaria-mega'],
  banette: ['banette-mega'],
  absol: ['absol-mega'],
  glalie: ['glalie-mega'],
  salamence: ['salamence-mega'],
  metagross: ['metagross-mega'],
  latias: ['latias-mega'],
  latios: ['latios-mega'],
  rayquaza: ['rayquaza-mega'],
  lopunny: ['lopunny-mega'],
  garchomp: ['garchomp-mega'],
  lucario: ['lucario-mega'],
  abomasnow: ['abomasnow-mega'],
  gallade: ['gallade-mega'],
  audino: ['audino-mega'],
  diancie: ['diancie-mega'],
  // Legends: Z-A new Mega — verified stats (see customSpecies.js). The other
  // ~25 new Z-A Megas (Victreebel, Clefable, Starmie, Meganium, Feraligatr,
  // Skarmory, Froslass, Emboar, Excadrill, Scrafty, Scolipede, Eelektross,
  // Chandelure, Chesnaught, Delphox, Greninja, Pyroar, Malamar, Barbaracle,
  // Dragalge, Hawlucha, Zygarde, Drampa, Falinks, plus DLC additions like
  // Chimecho/Baxcalibur/Raichu/Zeraora/Staraptor/Heatran/Darkrai/Golurk/
  // Meowstic) aren't added here yet — I don't have verified stat spreads
  // for them and didn't want to guess. Same process as Dragonite once
  // real data's available: add stats to customSpecies.js, then the slug
  // here.
  dragonite: ['dragonite-mega-za'],
};
