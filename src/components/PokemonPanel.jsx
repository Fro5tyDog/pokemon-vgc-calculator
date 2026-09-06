import React, { useEffect } from 'react';
import { NATURES, ITEMS } from '../data/gameData';
import { calculateStat, applyStatStage } from '../utils/damageCalculator';
import { TOGGLEABLE_ABILITIES, INTIMIDATE } from '../utils/abilities';
import { MEGA_FORMS } from '../data/megaForms';
import { getEffectiveSpecies } from '../utils/combatant';
import { fetchPokemon } from '../api/pokeApi';
import SearchableSelect from './SearchableSelect';

const MAX_SP_PER_STAT = 32;
const MAX_SP_TOTAL = 66;
const FIXED_IV = 31; // Champions: every Pokémon is treated as perfect IVs
const FIXED_LEVEL = 50; // Champions: all battles are Lv. 50

const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const STAT_LABELS = { hp: 'HP', atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed' };

const megaLabel = (slug) =>
  slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/**
 * Compute the actual in-battle value of one stat from base/IV/EV/nature/stage,
 * for the live Base -> Actual Stat display.
 */
const computeActualStat = (stat, baseValue, sp, natureData, stage) => {
  const isHP = stat === 'hp';
  const natureMultiplier = isHP ? 1.0 : (natureData?.[stat] || 1.0);
  const raw = calculateStat(baseValue, FIXED_IV, sp * 8, FIXED_LEVEL, natureMultiplier, isHP);
  return isHP ? raw : applyStatStage(raw, stage || 0);
};

// Species selection now happens via TeamStrip (the 6-box team roster above
// this panel) — species/sprite fetching for the active slot is handled
// there too, this panel just displays whatever's already on pokemon.species.
// `opponent` is used only to reflect their Intimidate (if active) into this
// Pokémon's displayed Attack stage — the underlying stored stage stays the
// user's own manual value; only the DISPLAY (and the calc) folds it in.
export default function PokemonPanel({ pokemon, setPokemon, opponent }) {
  const incomingAtkAdjustment = opponent?.ability === 'Intimidate' && opponent?.abilityActive ? -1 : 0;
  const megaOptions = pokemon?.speciesSlug ? MEGA_FORMS[pokemon.speciesSlug] || [] : [];

  // Fetch the Mega form's own species data (stats/types/abilities) whenever
  // a mega form is picked — analogous to the base species fetch, but for
  // whichever form is currently selected.
  useEffect(() => {
    if (!pokemon?.megaForm) return;
    if (pokemon.megaSpecies?.apiName === pokemon.megaForm) return; // already loaded
    let cancelled = false;
    setPokemon((prev) => ({ ...prev, megaSpecies: null, megaSpeciesError: null, megaSpeciesLoading: true }));
    fetchPokemon(pokemon.megaForm)
      .then((data) => {
        if (cancelled) return;
        setPokemon((prev) =>
          prev.megaForm === data.apiName
            ? { ...prev, megaSpecies: data, megaSpeciesLoading: false, ability: data.abilities[0]?.name || prev.ability }
            : prev
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setPokemon((prev) => ({ ...prev, megaSpeciesLoading: false, megaSpeciesError: err.message }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokemon?.megaForm]);

  const effectiveSpecies = getEffectiveSpecies(pokemon);

  const handleSPChange = (stat, rawValue) => {
    const oldValue = pokemon.sp[stat];
    const currentTotal = Object.values(pokemon.sp).reduce((a, b) => a + b, 0);
    const requested = Math.max(0, Math.min(MAX_SP_PER_STAT, parseInt(rawValue) || 0));
    const roomLeft = MAX_SP_TOTAL - (currentTotal - oldValue);
    const clamped = Math.min(requested, roomLeft);
    setPokemon({ ...pokemon, sp: { ...pokemon.sp, [stat]: clamped } });
  };

  // The Stage input shows the EFFECTIVE stage (own manual stage + any
  // incoming Intimidate on Attack). Editing it stores back only the "own"
  // portion, so toggling Intimidate off later doesn't lose what the user
  // actually set.
  const handleStatStageChange = (stat, value) => {
    const incomingAdjustment = stat === 'atk' ? incomingAtkAdjustment : 0;
    const desiredEffective = Math.min(6, Math.max(-6, parseInt(value) || 0));
    const rawStage = desiredEffective - incomingAdjustment;
    setPokemon({ ...pokemon, statStages: { ...pokemon.statStages, [stat]: rawStage } });
  };

  const spTotal = pokemon ? Object.values(pokemon.sp).reduce((a, b) => a + b, 0) : 0;

  // Fixed-size box regardless of state, so picking/clearing a Pokémon never
  // shifts the Field Conditions column or the other side's panel.
  const containerStyle = { border: '1px solid #ddd', padding: '8px', borderRadius: '4px', minHeight: '340px', boxSizing: 'border-box', fontSize: '0.95em' };

  if (!pokemon || !pokemon.species) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#999', padding: '10px' }}>
          {pokemon?.speciesError
            ? `Error: ${pokemon.speciesError}`
            : pokemon?.speciesLoading
            ? 'Loading Pokémon data...'
            : 'Select a Pokémon to view stats here'}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {pokemon.species && (
        <div style={{ fontSize: '0.9em', marginBottom: '6px' }}>
          Types: {effectiveSpecies?.types.join(', ')}
        </div>
      )}

      {/* Mega Evolution — only shown for species that have one. Switching
          forms swaps stats/types/ability to the mega's own (fetched
          separately) while keeping moves/EVs/nature/item as configured. */}
      {megaOptions.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <label>
            Mega Form:
            <SearchableSelect
              options={[
                { name: pokemon.species.name, apiName: '' },
                ...megaOptions.map((slug) => ({ name: megaLabel(slug), apiName: slug })),
              ]}
              value={pokemon.megaForm || ''}
              onChange={(val) => {
                if (!val) {
                  setPokemon({ ...pokemon, megaForm: null, megaSpecies: null, megaSpeciesError: null, ability: pokemon.species?.abilities[0]?.name || null });
                } else {
                  setPokemon({ ...pokemon, megaForm: val, megaSpecies: null, megaSpeciesError: null });
                }
              }}
              placeholder={pokemon.species.name}
            />
          </label>
          {pokemon.megaSpeciesLoading && <span style={{ fontSize: '0.85em', color: '#666', marginLeft: '6px' }}>Loading...</span>}
          {pokemon.megaSpeciesError && <span style={{ fontSize: '0.85em', color: '#c00', marginLeft: '6px' }}>Error: {pokemon.megaSpeciesError}</span>}
        </div>
      )}

      {/* Item, Ability, Nature */}
      <div style={{ marginBottom: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        <label>
          Item:
          <SearchableSelect
            options={[{ name: 'None', apiName: '' }, ...Object.values(ITEMS).map((data) => ({ name: data.name, apiName: data.name }))]}
            value={pokemon.item || ''}
            onChange={(val) => setPokemon({ ...pokemon, item: val || null })}
            placeholder="None"
          />
        </label>

        <label>
          Ability:
          <SearchableSelect
            options={(effectiveSpecies?.abilities || []).map((a) => ({ name: `${a.name}${a.isHidden ? ' (Hidden)' : ''}`, apiName: a.name }))}
            value={pokemon.ability || ''}
            onChange={(val) => setPokemon({ ...pokemon, ability: val || null, abilityActive: false })}
            placeholder={!pokemon.species ? 'Loading...' : 'Select...'}
            disabled={!pokemon.species}
          />
        </label>

        <label>
          Nature:
          <SearchableSelect
            options={[{ name: 'Neutral', apiName: '' }, ...Object.entries(NATURES).map(([key, data]) => ({ name: data.name, apiName: key }))]}
            value={pokemon.nature || ''}
            onChange={(val) => setPokemon({ ...pokemon, nature: val || null })}
            placeholder="Neutral"
          />
        </label>

        <label>
          Level:
          <input type="number" value={FIXED_LEVEL} disabled title="Champions battles are always Lv. 50" />
        </label>
      </div>

      {/* Toggle for abilities whose effect depends on being "activated" —
          Intimidate (lowers the OPPONENT's Attack) and Protosynthesis/Quark
          Drive (boosts THIS Pokémon's own highest stat by 1.3x). */}
      {pokemon.ability && TOGGLEABLE_ABILITIES.has(pokemon.ability) && (
        <div style={{ marginBottom: '6px', fontSize: '0.9em' }}>
          <label>
            <input
              type="checkbox"
              checked={!!pokemon.abilityActive}
              onChange={(e) => setPokemon({ ...pokemon, abilityActive: e.target.checked })}
            />
            {' '}
            {pokemon.ability === INTIMIDATE
              ? "Intimidate active (opponent's Attack -1)"
              : `${pokemon.ability} active (+30% highest stat)`}
          </label>
        </div>
      )}

      {/* Tera Type */}
      <div style={{ marginBottom: '6px' }}>
        <label>
          Tera Type:
          <select
            value={pokemon.teraType || ''}
            onChange={(e) => setPokemon({ ...pokemon, teraType: e.target.value || null })}
          >
            <option value="">None</option>
            {['Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Stats table: Base / IV / EV / Stat Stage / live computed Actual Stat */}
      <div style={{ marginBottom: '6px', border: '1px solid #eee', padding: '5px' }}>
        <h4 style={{ fontSize: '0.95em', margin: '0 0 4px 0', color: spTotal > MAX_SP_TOTAL ? '#c00' : undefined }}>
          Stats (EV Total: {spTotal}/{MAX_SP_TOTAL})
        </h4>
        {!pokemon.species && <div style={{ fontSize: '0.9em', color: '#666' }}>Loading base stats...</div>}
        {pokemon.species && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: '2px' }}>Stat</th>
                <th style={{ padding: '2px' }}>Base</th>
                <th style={{ padding: '2px', opacity: 0.6 }}>IV</th>
                <th style={{ padding: '2px' }}>EVs</th>
                <th style={{ padding: '2px' }}>Stage</th>
                <th style={{ padding: '2px' }}>Actual Stat</th>
              </tr>
            </thead>
            <tbody>
              {STATS.map((stat) => {
                const baseValue = effectiveSpecies?.baseStats[stat] ?? 0;
                const natureData = pokemon.nature ? NATURES[pokemon.nature] : null;
                const rawStage = stat === 'hp' ? 0 : (pokemon.statStages?.[stat] ?? 0);
                const incomingAdjustment = stat === 'atk' ? incomingAtkAdjustment : 0;
                const stage = Math.max(-6, Math.min(6, rawStage + incomingAdjustment));
                const actual = computeActualStat(stat, baseValue, pokemon.sp[stat], natureData, stage);
                const natureMult = stat === 'hp' ? 1.0 : (natureData?.[stat] || 1.0);
                return (
                  <tr key={stat} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '2px' }}>{STAT_LABELS[stat]}</td>
                    <td style={{ padding: '2px' }}>{baseValue}</td>
                    <td style={{ padding: '2px', opacity: 0.6 }}>{FIXED_IV}</td>
                    <td style={{ padding: '2px' }}>
                      <input
                        type="number"
                        value={pokemon.sp[stat]}
                        onChange={(e) => handleSPChange(stat, e.target.value)}
                        min="0"
                        max={MAX_SP_PER_STAT}
                        style={{ width: '38px' }}
                      />
                    </td>
                    <td style={{ padding: '2px' }}>
                      {stat === 'hp' ? (
                        <span style={{ opacity: 0.4 }}>—</span>
                      ) : (
                        <input
                          type="number"
                          value={stage}
                          title={incomingAdjustment !== 0 ? `Includes ${incomingAdjustment} from opponent's Intimidate` : undefined}
                          onChange={(e) => handleStatStageChange(stat, e.target.value)}
                          min="-6"
                          max="6"
                          style={{ width: '32px' }}
                        />
                      )}
                    </td>
                    <td
                      style={{
                        padding: '2px',
                        fontWeight: 'bold',
                        color: natureMult > 1 ? '#2a7a2a' : natureMult < 1 ? '#a33' : undefined,
                      }}
                    >
                      {actual}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
