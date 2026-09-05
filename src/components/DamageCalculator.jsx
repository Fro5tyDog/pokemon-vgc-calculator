import React, { useState, useEffect } from 'react';
import { calculateDamage } from '../utils/damageCalculator';
import { NATURES, TYPE_CHART } from '../data/gameData';
import { buildCombatant, activeMove } from '../utils/combatant';
import { fetchMoveDetails, fetchAllMoveNames } from '../api/pokeApi';
import PokemonPanel from './PokemonPanel';
import MoveSelector from './MoveSelector';
import DamageOutput from './DamageOutput';

const FIXED_IV = 31;
const FIXED_LEVEL = 50;
const MOVE_SLOT_COUNT = 4;

const emptyMoveSlot = () => ({ apiName: '', details: null, loading: false, error: null });

const makeDefaultPokemon = (speciesSlug) => ({
  speciesSlug,
  species: null,
  speciesLoading: false,
  speciesError: null,
  moves: Array.from({ length: MOVE_SLOT_COUNT }, emptyMoveSlot),
  activeMoveIndex: 0,
  item: null,
  ability: null,
  nature: 'adamant',
  level: FIXED_LEVEL,
  isCritical: false,
  sp: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  iv: { hp: FIXED_IV, atk: FIXED_IV, def: FIXED_IV, spa: FIXED_IV, spd: FIXED_IV, spe: FIXED_IV },
  statStages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  teraType: null,
});

const STAT_ABBREV = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' };

const natureSign = (pokemon, stat) => {
  if (stat === 'hp') return '';
  const nd = pokemon.nature ? NATURES[pokemon.nature] : null;
  const mult = nd?.[stat] || 1;
  if (mult > 1) return '+';
  if (mult < 1) return '-';
  return '';
};
const formatSpread = (pokemon, stat) =>
  `${pokemon.sp[stat]}${natureSign(pokemon, stat)} ${STAT_ABBREV[stat]}`;

const buildSummaryLine = (attackerP, defenderP, move, result) => {
  if (!result || !move) return '';
  if (!result.damageRange) {
    return `${attackerP.species.name} ${move.name} vs. ${defenderP.species.name}: no damage (Status move)`;
  }
  const atkStat = move.category === 'Physical' ? 'atk' : 'spa';
  const defStat = move.category === 'Physical' ? 'def' : 'spd';
  const { minDamage, maxDamage, damageRange, koInHits } = result;
  return (
    `${formatSpread(attackerP, atkStat)} ${attackerP.species.name} ${move.name} vs. ` +
    `${formatSpread(defenderP, 'hp')} / ${formatSpread(defenderP, defStat)} ${defenderP.species.name}: ` +
    `${minDamage}-${maxDamage} (${damageRange.minPercent}% - ${damageRange.maxPercent}%) -- ${koInHits}`
  );
};

// Picking (or clearing) a move in a slot: update the slot right away so the
// UI reflects it immediately, fetch full details in the background, and
// auto-activate the slot the moment a move is picked — this is what lets
// the move list double as the selector, no separate "active" control needed.
const makeMoveSlotHandler = (setPokemon) => (index, apiName) => {
  setPokemon((prev) => {
    const newMoves = [...prev.moves];
    newMoves[index] = { apiName, details: null, loading: !!apiName, error: null };
    return { ...prev, moves: newMoves, activeMoveIndex: apiName ? index : prev.activeMoveIndex };
  });

  if (!apiName) return;

  fetchMoveDetails(apiName)
    .then((data) => {
      setPokemon((prev) => {
        if (prev.moves[index]?.apiName !== apiName) return prev; // stale response
        const newMoves = [...prev.moves];
        newMoves[index] = { apiName, details: data, loading: false, error: null };
        return { ...prev, moves: newMoves };
      });
    })
    .catch((err) => {
      setPokemon((prev) => {
        if (prev.moves[index]?.apiName !== apiName) return prev;
        const newMoves = [...prev.moves];
        newMoves[index] = { apiName, details: null, loading: false, error: err.message };
        return { ...prev, moves: newMoves };
      });
    });
};

export default function DamageCalculator() {
  const [pokemon1, setPokemon1] = useState(makeDefaultPokemon('basculegion'));
  const [pokemon2, setPokemon2] = useState(makeDefaultPokemon('garchomp'));
  const [allMoves, setAllMoves] = useState([]);
  const [allMovesLoading, setAllMovesLoading] = useState(true);

  const [fieldState, setFieldState] = useState({
    weather: 'None',
    terrain: 'None',
    isDoublesFormat: false,
  });

  // Full move list fetched once here (not per-panel) since both Pokémon's
  // move selectors share it.
  useEffect(() => {
    fetchAllMoveNames()
      .then((list) => setAllMoves(list))
      .catch((err) => console.error(err))
      .finally(() => setAllMovesLoading(false));
  }, []);

  const handleMoveSlot1 = makeMoveSlotHandler(setPokemon1);
  const handleMoveSlot2 = makeMoveSlotHandler(setPokemon2);

  const bothSpeciesLoaded = pokemon1.species && pokemon2.species;

  const move1 = activeMove(pokemon1);
  const result1to2 =
    bothSpeciesLoaded && move1
      ? calculateDamage({ ...buildCombatant(pokemon1), move: move1 }, buildCombatant(pokemon2), fieldState, TYPE_CHART)
      : null;

  const move2 = activeMove(pokemon2);
  const result2to1 =
    bothSpeciesLoaded && move2
      ? calculateDamage({ ...buildCombatant(pokemon2), move: move2 }, buildCombatant(pokemon1), fieldState, TYPE_CHART)
      : null;

  const summary1to2 = bothSpeciesLoaded ? buildSummaryLine(pokemon1, pokemon2, move1, result1to2) : '';
  const summary2to1 = bothSpeciesLoaded ? buildSummaryLine(pokemon2, pokemon1, move2, result2to1) : '';

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Pokémon Champions Damage Calculator</h1>

      {!bothSpeciesLoaded && (
        <div style={{ padding: '15px', marginBottom: '20px', border: '1px dashed #ccc', color: '#666', fontStyle: 'italic' }}>
          Loading Pokémon data...
        </div>
      )}

      {/* Move lists double as the move picker for each Pokémon — pick a
          move here, no separate selection UI elsewhere */}
      {bothSpeciesLoaded && (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <MoveSelector
            pokemon={pokemon1}
            setPokemon={setPokemon1}
            opponent={pokemon2}
            fieldState={fieldState}
            allMoves={allMoves}
            allMovesLoading={allMovesLoading}
            onMoveSlotChange={handleMoveSlot1}
          />
          <MoveSelector
            pokemon={pokemon2}
            setPokemon={setPokemon2}
            opponent={pokemon1}
            fieldState={fieldState}
            allMoves={allMoves}
            allMovesLoading={allMovesLoading}
            onMoveSlotChange={handleMoveSlot2}
          />
        </div>
      )}

      {/* Detailed result for whichever move is active on each side */}
      {bothSpeciesLoaded && (
        <div style={{ marginBottom: '20px' }}>
          {result1to2 ? (
            <DamageOutput result={result1to2} summaryLine={summary1to2} />
          ) : (
            <div style={{ padding: '4px 0', color: '#666', fontStyle: 'italic', fontSize: '14px' }}>
              Select an active move for {pokemon1.species.name}.
            </div>
          )}
          {result2to1 ? (
            <DamageOutput result={result2to1} summaryLine={summary2to1} />
          ) : (
            <div style={{ padding: '4px 0', color: '#666', fontStyle: 'italic', fontSize: '14px' }}>
              Select an active move for {pokemon2.species.name}.
            </div>
          )}
        </div>
      )}

      {/* Pokémon 1 | Field (middle) | Pokémon 2 */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 320px', minWidth: '300px' }}>
          <h2>Pokémon 1</h2>
          <PokemonPanel pokemon={pokemon1} setPokemon={setPokemon1} />
        </div>

        <div style={{ flex: '1 1 220px', minWidth: '220px', border: '1px solid #ccc', padding: '10px' }}>
          <h3>Field Conditions</h3>
          <label style={{ display: 'block', marginBottom: '10px' }}>
            Weather:
            <select
              value={fieldState.weather}
              onChange={(e) => setFieldState({ ...fieldState, weather: e.target.value })}
            >
              <option>None</option>
              <option>Harsh Sunlight</option>
              <option>Rain</option>
              <option>Sandstorm</option>
              <option>Hail</option>
            </select>
          </label>

          <label style={{ display: 'block', marginBottom: '10px' }}>
            Terrain:
            <select
              value={fieldState.terrain}
              onChange={(e) => setFieldState({ ...fieldState, terrain: e.target.value })}
            >
              <option>None</option>
              <option>Grassy Terrain</option>
              <option>Electric Terrain</option>
              <option>Psychic Terrain</option>
              <option>Misty Terrain</option>
            </select>
          </label>

          <label style={{ display: 'block' }}>
            <input
              type="checkbox"
              checked={fieldState.isDoublesFormat}
              onChange={(e) => setFieldState({ ...fieldState, isDoublesFormat: e.target.checked })}
            />
            {' '}Doubles Format
          </label>
          {fieldState.isDoublesFormat && (
            <div style={{ fontSize: '0.8em', color: '#666', marginTop: '6px' }}>
              Spread moves (e.g. Earthquake, Rock Slide) auto-detected from PokeAPI's
              move target data and reduced to 75% damage.
            </div>
          )}
        </div>

        <div style={{ flex: '1 1 320px', minWidth: '300px' }}>
          <h2>Pokémon 2</h2>
          <PokemonPanel pokemon={pokemon2} setPokemon={setPokemon2} />
        </div>
      </div>
    </div>
  );
}
