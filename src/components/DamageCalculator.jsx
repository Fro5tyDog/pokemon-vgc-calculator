import React, { useState, useEffect } from 'react';
import { calculateDamage } from '../utils/damageCalculator';
import { NATURES, TYPE_CHART } from '../data/gameData';
import {
  buildCombatant,
  activeMove,
  activeMoveSlot,
  makeInitialSide,
  activePokemon,
  activeTeamBaseAttacks,
  makeActiveSlotSetter,
  withIncomingEffects,
} from '../utils/combatant';
import { fetchMoveDetails, fetchAllMoveNames, fetchPokemon } from '../api/pokeApi';
import { isAlwaysCrit, needsWeightData, needsSpeedData, needsFaintedAllyCount, isBeatUp } from '../utils/specialMoves';
import PokemonPanel from './PokemonPanel';
import MoveSelector from './MoveSelector';
import DamageOutput from './DamageOutput';
import TeamStrip from './TeamStrip';
import ImportPanel from './ImportPanel';

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

const buildSummaryLine = (attackerP, defenderP, move, result, isCritical) => {
  if (!result || !move) return '';
  const critSuffix = isCritical ? ' on a critical hit' : '';
  if (!result.damageRange) {
    return `${attackerP.species.name} ${move.name} vs. ${defenderP.species.name}: no damage (Status move)`;
  }
  const atkStat = move.category === 'Physical' ? 'atk' : 'spa';
  const defStat = move.category === 'Physical' ? 'def' : 'spd';
  const { minDamage, maxDamage, damageRange, koInHits, screenLabel, terrainLabel, effectivePower } = result;

  // "-1" style prefix when the attacker's effective stage for the relevant
  // stat isn't neutral (own manual stage + any incoming Intimidate, same
  // effective value the stats table shows).
  const atkStage = attackerP.statStages?.[atkStat] ?? 0;
  const stagePrefix = atkStage > 0 ? `+${atkStage} ` : atkStage < 0 ? `${atkStage} ` : '';

  // "(80 BP)" annotation only for moves whose power isn't a fixed number —
  // otherwise it's just clutter for ordinary moves.
  const isVariablePower = needsWeightData(move.apiName) || needsSpeedData(move.apiName) || needsFaintedAllyCount(move.apiName) || isBeatUp(move.apiName);
  const powerAnnotation = isVariablePower ? ` (${effectivePower} BP)` : '';

  const screenSuffix = screenLabel ? ` through ${screenLabel}` : terrainLabel ? ` in ${terrainLabel}` : '';

  return (
    `${stagePrefix}${formatSpread(attackerP, atkStat)} ${attackerP.species.name} ${move.name}${powerAnnotation} vs. ` +
    `${formatSpread(defenderP, 'hp')} / ${formatSpread(defenderP, defStat)} ${defenderP.species.name}${screenSuffix}` +
    `${critSuffix}: ${minDamage}-${maxDamage} (${damageRange.minPercent}% - ${damageRange.maxPercent}%) -- ${koInHits}`
  );
};

// Picking (or clearing) a move in a slot: update the slot right away, fetch
// full details in the background, auto-activate the slot the moment a move
// is picked, auto-check the crit toggle for always-crit moves, and reset
// per-move extras for the newly picked move.
const makeMoveSlotHandler = (setPokemon) => (index, apiName) => {
  setPokemon((prev) => {
    const newMoves = [...prev.moves];
    newMoves[index] = {
      apiName,
      details: null,
      loading: !!apiName,
      error: null,
      isCritical: isAlwaysCrit(apiName),
      hitCount: null,
      faintedAllies: 0,
    };
    return { ...prev, moves: newMoves, activeMoveIndex: apiName ? index : prev.activeMoveIndex };
  });

  if (!apiName) return;

  fetchMoveDetails(apiName)
    .then((data) => {
      setPokemon((prev) => {
        if (prev.moves[index]?.apiName !== apiName) return prev; // stale response
        const newMoves = [...prev.moves];
        newMoves[index] = { ...newMoves[index], apiName, details: data, loading: false, error: null };
        return { ...prev, moves: newMoves };
      });
    })
    .catch((err) => {
      setPokemon((prev) => {
        if (prev.moves[index]?.apiName !== apiName) return prev;
        const newMoves = [...prev.moves];
        newMoves[index] = { ...newMoves[index], apiName, details: null, loading: false, error: err.message };
        return { ...prev, moves: newMoves };
      });
    });
};

// Builds the { ...combatant, move, isCritical } shape calculateDamage()
// needs for whichever Pokémon is attacking, pulling hitCount/faintedAllies/
// isCritical from the active move slot and teamBaseAttacks from the roster.
const buildAttackerInput = (pokemon, teamBaseAttacks) => {
  const slot = activeMoveSlot(pokemon);
  const move = activeMove(pokemon);
  if (!move || !slot) return null;
  return {
    ...buildCombatant(pokemon),
    move: { ...move, hitCount: slot.hitCount, faintedAllies: slot.faintedAllies, teamBaseAttacks },
    isCritical: slot.isCritical,
  };
};

// Self-healing: whenever a team slot has a speciesSlug but no fetched
// species data yet (a fresh pick, or a team switched into), fetch it. Only
// scans the currently-active team — other teams' members load once you
// page to them.
function useTeamSpeciesFetch(side, setSide) {
  useEffect(() => {
    const team = side.teams[side.activeTeamIndex];
    team.forEach((slot, idx) => {
      if (slot && slot.speciesSlug && !slot.species && !slot.speciesLoading && !slot.speciesError) {
        setSide((prev) => {
          const newTeams = prev.teams.map((t, ti) =>
            ti === prev.activeTeamIndex ? t.map((s, si) => (si === idx ? { ...s, speciesLoading: true } : s)) : t
          );
          return { ...prev, teams: newTeams };
        });

        fetchPokemon(slot.speciesSlug)
          .then((data) => {
            setSide((prev) => {
              const newTeams = prev.teams.map((t, ti) =>
                ti === prev.activeTeamIndex
                  ? t.map((s, si) =>
                      si === idx && s?.speciesSlug === slot.speciesSlug
                        ? { ...s, species: data, speciesLoading: false, ability: data.abilities[0]?.name || '' }
                        : s
                    )
                  : t
              );
              return { ...prev, teams: newTeams };
            });
          })
          .catch((err) => {
            setSide((prev) => {
              const newTeams = prev.teams.map((t, ti) =>
                ti === prev.activeTeamIndex
                  ? t.map((s, si) =>
                      si === idx && s?.speciesSlug === slot.speciesSlug
                        ? { ...s, speciesLoading: false, speciesError: err.message }
                        : s
                    )
                  : t
              );
              return { ...prev, teams: newTeams };
            });
          });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side]);
}

export default function DamageCalculator() {
  const [side1, setSide1] = useState(() => makeInitialSide());
  const [side2, setSide2] = useState(() => makeInitialSide());
  const [allMoves, setAllMoves] = useState([]);
  const [allMovesLoading, setAllMovesLoading] = useState(true);

  const [fieldState, setFieldState] = useState({
    weather: 'None',
    terrain: 'None',
    isDoublesFormat: false,
    gravity: false,
    side1: { lightScreen: false, reflect: false, auroraVeil: false, helpingHand: false, tailwind: false },
    side2: { lightScreen: false, reflect: false, auroraVeil: false, helpingHand: false, tailwind: false },
  });

  useTeamSpeciesFetch(side1, setSide1);
  useTeamSpeciesFetch(side2, setSide2);

  useEffect(() => {
    fetchAllMoveNames()
      .then((list) => setAllMoves(list))
      .catch((err) => console.error(err))
      .finally(() => setAllMovesLoading(false));
  }, []);

  const setPokemon1 = makeActiveSlotSetter(setSide1);
  const setPokemon2 = makeActiveSlotSetter(setSide2);

  const pokemon1 = activePokemon(side1);
  const pokemon2 = activePokemon(side2);

  const teamBaseAttacks1 = activeTeamBaseAttacks(side1);
  const teamBaseAttacks2 = activeTeamBaseAttacks(side2);

  const move1 = pokemon1 ? activeMove(pokemon1) : null;
  const bothSpeciesReady = !!(pokemon1?.species && pokemon2?.species);
  // withIncomingEffects goes on BOTH sides here — normally Intimidate only
  // matters once the intimidated Pokémon is attacking, but Foul Play reads
  // the DEFENDER's Attack stat while they're defending, so that role needs
  // the adjustment too. Applying it to both is harmless for ordinary moves
  // (a defender's Attack stat is otherwise never read) and necessary for
  // Foul Play to reflect an already-applied Intimidate correctly.
  // fieldEffects (screens/Helping Hand/Tailwind) are attached per-side so
  // damageCalculator.js can tell which side's conditions apply to whichever
  // role (attacker/defender) each Pokémon is playing in a given calc.
  const attackerInput1 = bothSpeciesReady && move1
    ? { ...buildAttackerInput(withIncomingEffects(pokemon1, pokemon2), teamBaseAttacks1), fieldEffects: fieldState.side1 }
    : null;
  const result1to2 = attackerInput1
    ? calculateDamage(attackerInput1, { ...buildCombatant(withIncomingEffects(pokemon2, pokemon1)), fieldEffects: fieldState.side2 }, fieldState, TYPE_CHART)
    : null;

  const move2 = pokemon2 ? activeMove(pokemon2) : null;
  const attackerInput2 = bothSpeciesReady && move2
    ? { ...buildAttackerInput(withIncomingEffects(pokemon2, pokemon1), teamBaseAttacks2), fieldEffects: fieldState.side2 }
    : null;
  const result2to1 = attackerInput2
    ? calculateDamage(attackerInput2, { ...buildCombatant(withIncomingEffects(pokemon1, pokemon2)), fieldEffects: fieldState.side1 }, fieldState, TYPE_CHART)
    : null;

  const summary1to2 = result1to2 ? buildSummaryLine(withIncomingEffects(pokemon1, pokemon2), pokemon2, move1, result1to2, activeMoveSlot(pokemon1)?.isCritical) : '';
  const summary2to1 = result2to1 ? buildSummaryLine(withIncomingEffects(pokemon2, pokemon1), pokemon1, move2, result2to1, activeMoveSlot(pokemon2)?.isCritical) : '';

  const resultBoxStyle = { flex: '1 1 320px', minWidth: '280px', minHeight: '36px' };

  return (
    <div style={{ padding: '10px', fontFamily: 'sans-serif', fontSize: '13px' }}>
      <h1 style={{ fontSize: '1.3em', margin: '0 0 8px 0' }}>Pokémon Champions Damage Calculator</h1>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
        <MoveSelector
          pokemon={pokemon1}
          setPokemon={setPokemon1}
          opponent={pokemon2}
          fieldState={fieldState}
          allMoves={allMoves}
          allMovesLoading={allMovesLoading}
          onMoveSlotChange={makeMoveSlotHandler(setPokemon1)}
          teamBaseAttacks={teamBaseAttacks1}
          mySideEffects={fieldState.side1}
          opponentSideEffects={fieldState.side2}
        />
        <MoveSelector
          pokemon={pokemon2}
          setPokemon={setPokemon2}
          opponent={pokemon1}
          fieldState={fieldState}
          allMoves={allMoves}
          allMovesLoading={allMovesLoading}
          onMoveSlotChange={makeMoveSlotHandler(setPokemon2)}
          teamBaseAttacks={teamBaseAttacks2}
          mySideEffects={fieldState.side2}
          opponentSideEffects={fieldState.side1}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
        <div style={resultBoxStyle}>
          {result1to2 ? (
            <DamageOutput result={result1to2} summaryLine={summary1to2} />
          ) : (
            <div style={{ padding: '2px 0', color: '#999', fontStyle: 'italic', fontSize: '0.9em' }}>
              {pokemon1?.species ? `Select an active move for ${pokemon1.species.name}.` : 'Select a Pokémon above to see damage here.'}
            </div>
          )}
        </div>
        <div style={resultBoxStyle}>
          {result2to1 ? (
            <DamageOutput result={result2to1} summaryLine={summary2to1} />
          ) : (
            <div style={{ padding: '2px 0', color: '#999', fontStyle: 'italic', fontSize: '0.9em' }}>
              {pokemon2?.species ? `Select an active move for ${pokemon2.species.name}.` : 'Select a Pokémon above to see damage here.'}
            </div>
          )}
        </div>
      </div>

      {/* Team 1 | Field (middle) | Team 2 */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 300px', minWidth: '280px' }}>
          <h2 style={{ fontSize: '1em', margin: '0 0 4px 0' }}>Pokémon 1</h2>
          <TeamStrip side={side1} setSide={setSide1} />
          <PokemonPanel pokemon={pokemon1} setPokemon={setPokemon1} opponent={pokemon2} speedMultiplier={fieldState.side1.tailwind ? 2 : 1} />
          <ImportPanel setSide={setSide1} allMoves={allMoves} />
        </div>

        <div style={{ flex: '1 1 200px', minWidth: '200px', border: '1px solid #ccc', padding: '8px' }}>
          <h3 style={{ fontSize: '0.95em', margin: '0 0 6px 0' }}>Field Conditions</h3>
          <label style={{ display: 'block', marginBottom: '6px' }}>
            Weather:
            <select
              value={fieldState.weather}
              onChange={(e) => setFieldState({ ...fieldState, weather: e.target.value })}
            >
              <option>None</option>
              <option>Harsh Sunlight</option>
              <option>Rain</option>
              <option>Sandstorm</option>
              <option>Snow</option>
              <option>Desolate Land</option>
              <option>Primordial Sea</option>
              <option>Delta Stream</option>
            </select>
          </label>
          {fieldState.weather === 'Desolate Land' && (
            <div style={{ fontSize: '0.78em', color: '#666', marginBottom: '6px' }}>Water moves fail outright; Fire boosted 1.5x.</div>
          )}
          {fieldState.weather === 'Primordial Sea' && (
            <div style={{ fontSize: '0.78em', color: '#666', marginBottom: '6px' }}>Fire moves fail outright; Water boosted 1.5x.</div>
          )}
          {fieldState.weather === 'Delta Stream' && (
            <div style={{ fontSize: '0.78em', color: '#666', marginBottom: '6px' }}>Rock/Ice/Electric hit Flying-types neutrally instead of super-effectively.</div>
          )}

          <label style={{ display: 'block', marginBottom: '6px' }}>
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
          <div style={{ fontSize: '0.78em', color: '#666', marginBottom: '6px' }}>
            Terrain only affects grounded Pokémon — Flying-types and Levitate users are unaffected unless Gravity is active.
          </div>

          <label style={{ display: 'block', marginBottom: '6px' }}>
            <input
              type="checkbox"
              checked={fieldState.gravity}
              onChange={(e) => setFieldState({ ...fieldState, gravity: e.target.checked })}
            />
            {' '}Gravity (grounds Flying/Levitate)
          </label>

          <label style={{ display: 'block', marginBottom: '6px' }}>
            <input
              type="checkbox"
              checked={fieldState.isDoublesFormat}
              onChange={(e) => setFieldState({ ...fieldState, isDoublesFormat: e.target.checked })}
            />
            {' '}Doubles Format
          </label>
          {fieldState.isDoublesFormat && (
            <div style={{ fontSize: '0.78em', color: '#666', marginBottom: '6px' }}>
              Spread moves (e.g. Earthquake, Rock Slide) auto-detected from PokeAPI's
              move target data and reduced to 75% damage (or ~67% if screens are also up).
            </div>
          )}

          {/* Per-side conditions — screens protect that side, Helping Hand
              and Tailwind boost/speed-up whichever side is attacking */}
          {[1, 2].map((n) => {
            const key = `side${n}`;
            const side = fieldState[key];
            const update = (field, value) => setFieldState({ ...fieldState, [key]: { ...side, [field]: value } });
            return (
              <div key={n} style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #eee' }}>
                <div style={{ fontSize: '0.85em', fontWeight: 'bold', marginBottom: '3px' }}>Pokémon {n}'s Side</div>
                <label style={{ display: 'block', fontSize: '0.85em' }}>
                  <input type="checkbox" checked={side.reflect} onChange={(e) => update('reflect', e.target.checked)} /> Reflect
                </label>
                <label style={{ display: 'block', fontSize: '0.85em' }}>
                  <input type="checkbox" checked={side.lightScreen} onChange={(e) => update('lightScreen', e.target.checked)} /> Light Screen
                </label>
                <label style={{ display: 'block', fontSize: '0.85em' }}>
                  <input type="checkbox" checked={side.auroraVeil} onChange={(e) => update('auroraVeil', e.target.checked)} /> Aurora Veil
                </label>
                <label style={{ display: 'block', fontSize: '0.85em' }} title={!fieldState.isDoublesFormat ? 'Helping Hand needs an ally — only applies in Doubles Format' : undefined}>
                  <input
                    type="checkbox"
                    checked={side.helpingHand}
                    disabled={!fieldState.isDoublesFormat}
                    onChange={(e) => update('helpingHand', e.target.checked)}
                  />
                  {' '}Helping Hand{!fieldState.isDoublesFormat ? ' (Doubles only)' : ''}
                </label>
                <label style={{ display: 'block', fontSize: '0.85em' }}>
                  <input type="checkbox" checked={side.tailwind} onChange={(e) => update('tailwind', e.target.checked)} /> Tailwind
                </label>
              </div>
            );
          })}
        </div>

        <div style={{ flex: '1 1 300px', minWidth: '280px' }}>
          <h2 style={{ fontSize: '1em', margin: '0 0 4px 0' }}>Pokémon 2</h2>
          <TeamStrip side={side2} setSide={setSide2} />
          <PokemonPanel pokemon={pokemon2} setPokemon={setPokemon2} opponent={pokemon1} speedMultiplier={fieldState.side2.tailwind ? 2 : 1} />
          <ImportPanel setSide={setSide2} allMoves={allMoves} />
        </div>
      </div>
    </div>
  );
}
