import React, { useState } from 'react';
import { parseShowdownTeam } from '../utils/showdownImport';
import { fetchPokemon, fetchMoveDetails } from '../api/pokeApi';
import { makeDefaultPokemon, makeTeam, TEAM_SIZE } from '../utils/combatant';
import { NATURES } from '../data/gameData';
import { MEGA_STONE_TO_FORM } from '../data/customSpecies';

const emptyMoveSlot = () => ({
  apiName: '',
  details: null,
  loading: false,
  error: null,
  isCritical: false,
  hitCount: null,
  faintedAllies: 0,
});

/**
 * Paste a Showdown-format team, get a full team built from it — species,
 * item, ability, nature, EVs (already in Champions' 0-32/66 Stat Point
 * scale — no conversion needed), and up to 4 moves per Pokémon, matched
 * against already-loaded move data. Mega stone items (including the new
 * Legends: Z-A ones with verified data) auto-select the matching Mega Form
 * instead of being treated as a plain held item.
 */
export default function ImportPanel({ setSide, allMoves }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    setWarnings([]);
    const newWarnings = [];

    try {
      const specs = parseShowdownTeam(text).slice(0, TEAM_SIZE);
      if (specs.length === 0) {
        throw new Error('No Pokémon found in the pasted text — check the format matches a Showdown export.');
      }

      const builtPokemon = await Promise.all(
        specs.map(async (spec) => {
          let species;
          try {
            species = await fetchPokemon(spec.speciesSlug);
          } catch (err) {
            newWarnings.push(`${spec.speciesDisplay}: couldn't find this species (${err.message})`);
            return null;
          }

          let pokemon = { ...makeDefaultPokemon(spec.speciesSlug), species };

          if (spec.natureName) {
            const natureEntry = Object.entries(NATURES).find(([, d]) => d.name.toLowerCase() === spec.natureName.toLowerCase());
            if (natureEntry) {
              pokemon.nature = natureEntry[0];
            } else {
              newWarnings.push(`${spec.speciesDisplay}: nature "${spec.natureName}" not recognized, left as Adamant`);
            }
          }

          pokemon.sp = { ...pokemon.sp, ...spec.sp };

          // Mega stone item -> select the Mega Form instead of a held item
          const megaSlug = spec.itemName ? MEGA_STONE_TO_FORM[spec.itemName.toLowerCase()] : null;
          if (megaSlug) {
            pokemon.megaForm = megaSlug;
            try {
              pokemon.megaSpecies = await fetchPokemon(megaSlug);
            } catch (err) {
              newWarnings.push(`${spec.speciesDisplay}: couldn't load Mega Form data (${err.message})`);
            }
          } else if (spec.itemName) {
            pokemon.item = spec.itemName;
          }

          const abilitySource = pokemon.megaSpecies || species;
          if (spec.abilityName) {
            const match = abilitySource.abilities.find((a) => a.name.toLowerCase() === spec.abilityName.toLowerCase());
            if (match) {
              pokemon.ability = match.name;
            } else {
              pokemon.ability = abilitySource.abilities[0]?.name || null;
              newWarnings.push(`${spec.speciesDisplay}: ability "${spec.abilityName}" not found on this species, used ${pokemon.ability || 'none'} instead`);
            }
          } else {
            pokemon.ability = abilitySource.abilities[0]?.name || null;
          }

          const moveSlots = [];
          for (const moveName of spec.moveNames.slice(0, 4)) {
            const match = allMoves.find((m) => m.name.toLowerCase() === moveName.toLowerCase());
            if (!match) {
              newWarnings.push(`${spec.speciesDisplay}: move "${moveName}" not found`);
              moveSlots.push(emptyMoveSlot());
              continue;
            }
            try {
              const details = await fetchMoveDetails(match.apiName);
              moveSlots.push({ ...emptyMoveSlot(), apiName: match.apiName, details });
            } catch (err) {
              newWarnings.push(`${spec.speciesDisplay}: couldn't load "${moveName}" (${err.message})`);
              moveSlots.push({ ...emptyMoveSlot(), apiName: match.apiName, error: err.message });
            }
          }
          while (moveSlots.length < 4) moveSlots.push(emptyMoveSlot());
          pokemon.moves = moveSlots;
          pokemon.activeMoveIndex = moveSlots.findIndex((m) => m.apiName) >= 0 ? moveSlots.findIndex((m) => m.apiName) : 0;

          return pokemon;
        })
      );

      const newTeam = makeTeam();
      builtPokemon.forEach((p, i) => {
        if (p) newTeam[i] = p;
      });

      if (newTeam.every((s) => s === null)) {
        throw new Error('None of the Pokémon in that team could be imported — see warnings.');
      }

      const firstFilled = newTeam.findIndex((s) => s !== null);
      setSide((prev) => ({ ...prev, teams: [newTeam, ...prev.teams.slice(1)], activeTeamIndex: 0, activeSlotIndex: firstFilled }));
      setWarnings(newWarnings);
      if (newWarnings.length === 0) {
        setOpen(false);
        setText('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ marginTop: '6px', fontSize: '0.85em' }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ fontSize: '0.9em' }}>
        {open ? 'Cancel Import' : 'Import from Showdown'}
      </button>
      {open && (
        <div style={{ marginTop: '4px' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'Paste a Showdown-format team here...'}
            rows={6}
            style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '0.85em' }}
          />
          <button type="button" onClick={handleImport} disabled={importing || !text.trim()} style={{ marginTop: '4px' }}>
            {importing ? 'Importing...' : 'Import Team (replaces current team)'}
          </button>
          {error && <div style={{ color: '#c00', marginTop: '4px' }}>{error}</div>}
          {warnings.length > 0 && (
            <div style={{ color: '#a60', marginTop: '4px' }}>
              {warnings.map((w, i) => (
                <div key={i}>⚠ {w}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
