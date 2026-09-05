import React from 'react';
import { calculateDamage } from '../utils/damageCalculator';
import { buildCombatant } from '../utils/combatant';
import { TYPE_CHART } from '../data/gameData';

const MOVE_SLOT_COUNT = 4;

/**
 * Compact "N moves, pick one to see detail" list — mirrors the reference
 * calculator's layout. Each row IS the move picker (a select styled to
 * look like a row) AND shows a live quick-preview % against the current
 * opponent. Picking a new move in a row also makes it the active move;
 * clicking an already-filled row (without touching the dropdown) just
 * switches which one is active, so you can flip between moves you've
 * already set without re-selecting them.
 */
export default function MoveSelector({ pokemon, setPokemon, opponent, fieldState, allMoves, allMovesLoading, onMoveSlotChange }) {
  const getQuickPreview = (moveDetails) => {
    if (!moveDetails || !pokemon.species || !opponent?.species) return '0 - 0%';
    if (moveDetails.category === 'Status') return '0 - 0%';
    try {
      const result = calculateDamage(
        { ...buildCombatant(pokemon), move: moveDetails },
        buildCombatant(opponent),
        fieldState || {},
        TYPE_CHART
      );
      return `${result.damageRange.minPercent} - ${result.damageRange.maxPercent}%`;
    } catch {
      return '0 - 0%';
    }
  };

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '10px', flex: '1 1 320px', minWidth: '280px' }}>
      <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '8px' }}>
        {pokemon.species?.name || 'Pokémon'}'s Moves (select one to show detailed results)
      </div>
      {Array.from({ length: MOVE_SLOT_COUNT }).map((_, index) => {
        const slot = pokemon.moves[index];
        const isActive = pokemon.activeMoveIndex === index;
        const preview = slot.loading ? 'Loading...' : slot.details ? getQuickPreview(slot.details) : '0 - 0%';
        return (
          <div
            key={index}
            onClick={() => slot.apiName && setPokemon((prev) => ({ ...prev, activeMoveIndex: index }))}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              padding: '6px 10px',
              marginBottom: '4px',
              borderRadius: '4px',
              backgroundColor: isActive ? '#3a4a6b' : '#eaeaef',
              color: isActive ? '#fff' : '#333',
              cursor: slot.apiName ? 'pointer' : 'default',
            }}
          >
            <select
              value={slot.apiName}
              disabled={allMovesLoading}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onMoveSlotChange(index, e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                fontWeight: isActive ? 'bold' : 'normal',
              }}
            >
              <option value="" style={{ color: '#000' }}>
                {allMovesLoading ? 'Loading...' : '(No Move)'}
              </option>
              {allMoves.map((m) => (
                <option key={m.apiName} value={m.apiName} style={{ color: '#000' }}>
                  {m.name}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '0.85em', whiteSpace: 'nowrap' }}>{preview}</span>
          </div>
        );
      })}
    </div>
  );
}
