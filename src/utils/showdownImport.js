/**
 * Parses Pokémon Showdown's team export text format into plain specs this
 * app can build Pokémon from. Pure/synchronous — doesn't touch the network;
 * the caller (ImportPanel) does the async species/move fetching and
 * matching against already-loaded data.
 *
 * Handles: nicknames ("Nick (Species)"), gender markers, item, ability,
 * nature, EVs (already read as-is — Champions Showdown exports use the
 * 0-32/66 Stat Point scale directly, not the old 0-252 EV scale, so no
 * conversion is needed), and up to 4 moves. IVs and Level lines are read
 * but intentionally ignored — Champions fixes IVs at 31 and Level at 50
 * regardless of what's written.
 */

const STAT_ABBREV_TO_KEY = { HP: 'hp', Atk: 'atk', Def: 'def', SpA: 'spa', SpD: 'spd', Spe: 'spe' };

export const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[.:]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

/**
 * Species where gender is an actual FORM difference (different stats/
 * ability), not just cosmetic — PokeAPI models these as separate "-male"/
 * "-female" varieties. Showdown text marks the female form with a "-F"
 * suffix directly on the species name (e.g. "Indeedee-F"); an unlabelled
 * name defaults to male, which is also PokeAPI's own default variety for
 * these species so no special-casing is needed for that direction.
 */
const GENDERED_FORM_SLUG_SUFFIX = /-f$/;

/** "indeedee-f" -> "indeedee-female" (PokeAPI's actual variety slug). */
const resolveGenderedSlug = (slug) => (GENDERED_FORM_SLUG_SUFFIX.test(slug) ? slug.replace(GENDERED_FORM_SLUG_SUFFIX, '-female') : slug);

/** Splits a full pasted team into per-Pokémon blocks and parses each. */
export function parseShowdownTeam(text) {
  const blocks = text
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  return blocks.map(parseShowdownPokemon).filter(Boolean);
}

function parseShowdownPokemon(block) {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  let speciesRaw = lines[0];
  let itemName = null;

  const atIdx = speciesRaw.indexOf('@');
  if (atIdx >= 0) {
    itemName = speciesRaw.slice(atIdx + 1).trim();
    speciesRaw = speciesRaw.slice(0, atIdx).trim();
  }

  // Strip gender markers like "(M)" / "(F)"
  speciesRaw = speciesRaw.replace(/\s*\((M|F)\)\s*/gi, ' ').trim();

  // "Nickname (Species)" -> use the parenthesized species name
  const parenMatch = speciesRaw.match(/\(([^)]+)\)/);
  if (parenMatch) {
    speciesRaw = parenMatch[1].trim();
  }

  const spec = {
    speciesSlug: resolveGenderedSlug(slugify(speciesRaw)),
    speciesDisplay: speciesRaw,
    itemName,
    abilityName: null,
    natureName: null,
    sp: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    moveNames: [],
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^ability:/i.test(line)) {
      spec.abilityName = line.split(':').slice(1).join(':').trim();
    } else if (/^evs:/i.test(line)) {
      const evsPart = line.split(':').slice(1).join(':');
      evsPart.split('/').forEach((chunk) => {
        const m = chunk.trim().match(/^(\d+)\s+(\w+)$/);
        if (m) {
          const key = STAT_ABBREV_TO_KEY[m[2]];
          if (key) spec.sp[key] = parseInt(m[1], 10);
        }
      });
    } else if (/nature$/i.test(line)) {
      spec.natureName = line.replace(/nature$/i, '').trim();
    } else if (line.startsWith('-')) {
      spec.moveNames.push(line.slice(1).trim());
    }
    // Level: and IVs: lines are matched by nothing above and simply skipped
  }

  return spec;
}
