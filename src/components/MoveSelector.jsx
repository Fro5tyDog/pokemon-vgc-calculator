import React from 'react';
import { calculateDamage } from '../utils/damageCalculator';
import { buildCombatant, withIncomingEffects } from '../utils/combatant';
import { TYPE_CHART } from '../data/gameData';
import {
  isAlwaysCrit,
  getHitCountRange,
  needsFaintedAllyCount,
  isBeatUp,
} from '../utils/specialMoves';
import SearchableSelect from './SearchableSelect';

const MOVE_SLOT_COUNT = 4;

/**
 * Compact "N moves, pick one to see detail" list — mirrors the reference
 * calculator's layout. Each row IS the move picker (a select styled to
 * look like a row) AND shows a live quick-preview % against the current
 * opponent, a per-move critical-hit toggle, and (when relevant) a hit-count
 * or fainted-ally control for moves whose power/hits depend on them.
 */
export default function MoveSelector({ pokemon, setPokemon, opponent, fieldState, allMoves, allMovesLoading, onMoveSlotChange, teamBaseAttacks, mySideEffects, opponentSideEffects }) {
  const getQuickPreview = (slot) => {
    const moveDetails = slot.details;
    if (!moveDetails || !pokemon?.species || !opponent?.species) return '0 - 0%';
    if (moveDetails.category === 'Status') return '0 - 0%';
    try {
      const moveForCalc = {
        ...moveDetails,
        hitCount: slot.hitCount,
        faintedAllies: slot.faintedAllies,
        teamBaseAttacks,
      };
      const result = calculateDamage(
        { ...buildCombatant(withIncomingEffects(pokemon, opponent)), move: moveForCalc, isCritical: slot.isCritical, fieldEffects: mySideEffects },
        { ...buildCombatant(withIncomingEffects(opponent, pokemon)), fieldEffects: opponentSideEffects },
        fieldState || {},
        TYPE_CHART
      );
      return `${result.damageRange.minPercent} - ${result.damageRange.maxPercent}%`;
    } catch {
      return '0 - 0%';
    }
  };

  const updateSlotField = (index, field, value) => {
    setPokemon((prev) => {
      const newMoves = [...prev.moves];
      newMoves[index] = { ...newMoves[index], [field]: value };
      return { ...prev, moves: newMoves };
    });
  };

  // Fixed-size box regardless of state, so picking/clearing a Pokémon never
  // shifts anything else on the page — only the content inside changes.
  const containerStyle = {
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '6px',
    flex: '1 1 300px',
    minWidth: '260px',
    minHeight: '160px',
    boxSizing: 'border-box',
  };

  if (!pokemon || !pokemon.species) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#999', padding: '10px', fontSize: '0.95em' }}>
          {pokemon?.speciesError
            ? `Error: ${pokemon.speciesError}`
            : pokemon?.speciesLoading
            ? 'Loading Pokémon data...'
            : 'Select a Pokémon to choose moves here'}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '5px' }}>
        {pokemon.species?.name || 'Pokémon'}'s Moves (select one to show detailed results)
      </div>
      {Array.from({ length: MOVE_SLOT_COUNT }).map((_, index) => {
        const slot = pokemon.moves[index];
        const isActive = pokemon.activeMoveIndex === index;
        const preview = slot.loading ? 'Loading...' : slot.details ? getQuickPreview(slot) : '0 - 0%';
        const alwaysCrit = slot.details ? isAlwaysCrit(slot.details.apiName) : false;
        const hitRange = slot.details ? getHitCountRange(slot.details) : null;
        const showFaintedAllies = slot.details && needsFaintedAllyCount(slot.details.apiName);
        const showBeatUpInfo = slot.details && isBeatUp(slot.details.apiName);

        return (
          <div
            key={index}
            style={{
              marginBottom: '2px',
              borderRadius: '3px',
              backgroundColor: isActive ? '#3a4a6b' : '#eaeaef',
              color: isActive ? '#fff' : '#333',
            }}
          >
            <div
              onClick={() => slot.apiName && setPokemon((prev) => ({ ...prev, activeMoveIndex: index }))}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '3px 6px',
                cursor: slot.apiName ? 'pointer' : 'default',
              }}
            >
              {/* Plain text label — clicking anywhere on it just activates
                  this slot. It's NOT a form control, so there's no risk of
                  accidentally opening a dropdown when all you want to do is
                  select this move. */}
              <span
                style={{
                  flex: 1,
                  fontWeight: isActive ? 'bold' : 'normal',
                  opacity: slot.apiName ? 1 : 0.6,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {slot.details?.name || (allMovesLoading ? 'Loading...' : `Move ${index + 1}: (none)`)}
              </span>

              {/* Small dedicated "change move" control — a searchable
                  dropdown sized down to just an icon, so it never overlaps
                  with the "click to activate" area above. */}
              <div
                onClick={(e) => e.stopPropagation()}
                title="Change this move"
                style={{
                  width: '24px',
                  height: '24px',
                  minWidth: '24px',
                  border: '1px solid rgba(128,128,128,0.5)',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SearchableSelect
                  options={allMoves}
                  value={slot.apiName}
                  onChange={(apiName) => onMoveSlotChange(index, apiName)}
                  disabled={allMovesLoading}
                  fixedTriggerLabel="✎"
                  triggerStyle={{ textAlign: 'center', fontSize: '12px', color: 'inherit' }}
                />
              </div>

              {slot.apiName && (
                <label
                  onClick={(e) => e.stopPropagation()}
                  title={alwaysCrit ? 'This move always crits' : 'Critical hit'}
                  style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.8em', whiteSpace: 'nowrap', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={alwaysCrit || !!slot.isCritical}
                    disabled={alwaysCrit}
                    onChange={(e) => updateSlotField(index, 'isCritical', e.target.checked)}
                  />
                  Crit
                </label>
              )}

              <span style={{ fontSize: '0.85em', whiteSpace: 'nowrap', minWidth: '85px', textAlign: 'right' }}>{preview}</span>
            </div>

            {/* Hit-count selector for multi-hit moves (Dual Wingbeat, Surging
                Strikes, Triple Axel, ...) */}
            {hitRange && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px 4px 6px', fontSize: '0.75em' }}
              >
                <span>Hits:</span>
                <select
                  value={slot.hitCount || hitRange[1]}
                  onChange={(e) => updateSlotField(index, 'hitCount', parseInt(e.target.value))}
                  style={{ fontSize: '1em' }}
                >
                  {Array.from({ length: hitRange[1] - hitRange[0] + 1 }, (_, i) => hitRange[0] + i).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Beat Up's hit count is now automatic — one hit per populated
                team slot, per pokemondb's explanation of the mechanic */}
            {showBeatUpInfo && (
              <div style={{ padding: '0 6px 4px 6px', fontSize: '0.75em', opacity: 0.85 }}>
                {teamBaseAttacks && teamBaseAttacks.length > 0
                  ? `${teamBaseAttacks.length} hit(s), one per team member`
                  : 'Add team members for accurate hits (using this Pokémon alone for now)'}
              </div>
            )}

            {/* Fainted-ally count for Last Respects — no HP/faint tracking
                in this tool, so it's a manual input */}
            {showFaintedAllies && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px 4px 6px', fontSize: '0.75em' }}
              >
                <span>Fainted allies:</span>
                <select
                  value={slot.faintedAllies || 0}
                  onChange={(e) => updateSlotField(index, 'faintedAllies', parseInt(e.target.value))}
                  style={{ fontSize: '1em' }}
                >
                  {Array.from({ length: 6 }, (_, i) => i).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
