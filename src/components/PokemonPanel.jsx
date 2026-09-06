import React from 'react';
import { NATURES, ITEMS } from '../data/gameData';
import { calculateStat, applyStatStage } from '../utils/damageCalculator';

const MAX_SP_PER_STAT = 32;
const MAX_SP_TOTAL = 66;
const FIXED_IV = 31; // Champions: every Pokémon is treated as perfect IVs
const FIXED_LEVEL = 50; // Champions: all battles are Lv. 50

const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const STAT_LABELS = { hp: 'HP', atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed' };

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
export default function PokemonPanel({ pokemon, setPokemon }) {
  const handleSPChange = (stat, rawValue) => {
    const oldValue = pokemon.sp[stat];
    const currentTotal = Object.values(pokemon.sp).reduce((a, b) => a + b, 0);
    const requested = Math.max(0, Math.min(MAX_SP_PER_STAT, parseInt(rawValue) || 0));
    const roomLeft = MAX_SP_TOTAL - (currentTotal - oldValue);
    const clamped = Math.min(requested, roomLeft);
    setPokemon({ ...pokemon, sp: { ...pokemon.sp, [stat]: clamped } });
  };

  const handleStatStageChange = (stat, value) => {
    const clamped = Math.min(6, Math.max(-6, parseInt(value) || 0));
    setPokemon({ ...pokemon, statStages: { ...pokemon.statStages, [stat]: clamped } });
  };

  const spTotal = pokemon ? Object.values(pokemon.sp).reduce((a, b) => a + b, 0) : 0;

  // Fixed-size box regardless of state, so picking/clearing a Pokémon never
  // shifts the Field Conditions column or the other side's panel.
  const containerStyle = { border: '1px solid #ddd', padding: '15px', borderRadius: '4px', minHeight: '520px', boxSizing: 'border-box' };

  if (!pokemon || !pokemon.species) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#999', fontSize: '1.05em', padding: '20px' }}>
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
        <div style={{ fontSize: '0.9em', marginBottom: '15px' }}>
          Types: {pokemon.species.types.join(', ')}
        </div>
      )}

      {/* Item, Ability, Nature */}
      <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <label>
          Item:
          <select
            value={pokemon.item || ''}
            onChange={(e) => setPokemon({ ...pokemon, item: e.target.value || null })}
          >
            <option value="">None</option>
            {Object.entries(ITEMS).map(([key, data]) => (
              <option key={key} value={data.name}>
                {data.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Ability:
          <select
            value={pokemon.ability || ''}
            disabled={!pokemon.species}
            onChange={(e) => setPokemon({ ...pokemon, ability: e.target.value || null })}
          >
            {!pokemon.species && <option value="">Loading...</option>}
            {pokemon.species?.abilities.map((a) => (
              <option key={a.apiName} value={a.name}>
                {a.name}{a.isHidden ? ' (Hidden)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label>
          Nature:
          <select
            value={pokemon.nature || ''}
            onChange={(e) => setPokemon({ ...pokemon, nature: e.target.value || null })}
          >
            <option value="">Neutral</option>
            {Object.entries(NATURES).map(([key, data]) => (
              <option key={key} value={key}>
                {data.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Level:
          <input type="number" value={FIXED_LEVEL} disabled title="Champions battles are always Lv. 50" />
        </label>
      </div>

      {/* Tera Type */}
      <div style={{ marginBottom: '15px' }}>
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
      <div style={{ marginBottom: '15px', border: '1px solid #eee', padding: '10px' }}>
        <h4 style={{ color: spTotal > MAX_SP_TOTAL ? '#c00' : undefined }}>
          Stats (EV Total: {spTotal}/{MAX_SP_TOTAL})
        </h4>
        {!pokemon.species && <div style={{ fontSize: '0.9em', color: '#666' }}>Loading base stats...</div>}
        {pokemon.species && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: '4px' }}>Stat</th>
                <th style={{ padding: '4px' }}>Base</th>
                <th style={{ padding: '4px', opacity: 0.6 }}>IV</th>
                <th style={{ padding: '4px' }}>EVs</th>
                <th style={{ padding: '4px' }}>Stage</th>
                <th style={{ padding: '4px' }}>Actual Stat</th>
              </tr>
            </thead>
            <tbody>
              {STATS.map((stat) => {
                const baseValue = pokemon.species.baseStats[stat] ?? 0;
                const natureData = pokemon.nature ? NATURES[pokemon.nature] : null;
                const stage = stat === 'hp' ? 0 : (pokemon.statStages?.[stat] ?? 0);
                const actual = computeActualStat(stat, baseValue, pokemon.sp[stat], natureData, stage);
                const natureMult = stat === 'hp' ? 1.0 : (natureData?.[stat] || 1.0);
                return (
                  <tr key={stat} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '4px' }}>{STAT_LABELS[stat]}</td>
                    <td style={{ padding: '4px' }}>{baseValue}</td>
                    <td style={{ padding: '4px', opacity: 0.6 }}>{FIXED_IV}</td>
                    <td style={{ padding: '4px' }}>
                      <input
                        type="number"
                        value={pokemon.sp[stat]}
                        onChange={(e) => handleSPChange(stat, e.target.value)}
                        min="0"
                        max={MAX_SP_PER_STAT}
                        style={{ width: '50px' }}
                      />
                    </td>
                    <td style={{ padding: '4px' }}>
                      {stat === 'hp' ? (
                        <span style={{ opacity: 0.4 }}>—</span>
                      ) : (
                        <input
                          type="number"
                          value={pokemon.statStages?.[stat] ?? 0}
                          onChange={(e) => handleStatStageChange(stat, e.target.value)}
                          min="-6"
                          max="6"
                          style={{ width: '45px' }}
                        />
                      )}
                    </td>
                    <td
                      style={{
                        padding: '4px',
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
