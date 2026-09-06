import React, { useEffect, useState } from 'react';
import { fetchPokemon, fetchAllSpeciesNames } from '../api/pokeApi';
import { makeDefaultPokemon, makeTeam, TEAM_SIZE, getEffectiveSpecies } from '../utils/combatant';
import SearchableSelect from './SearchableSelect';

const slugToLabel = (slug) =>
  slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const BOX_SIZE = 38;

/**
 * Replaces the old single "Pokémon: [dropdown]" row — a row of 6 team-slot
 * boxes (sprites once populated) plus a 7th "add another team" box, with a
 * prev/next arrow toggle to page between teams you've built.
 */
export default function TeamStrip({ side, setSide }) {
  const [allSpecies, setAllSpecies] = useState([]);
  const [allSpeciesLoading, setAllSpeciesLoading] = useState(true);

  // Every Pokémon PokeAPI knows, fetched once — replaces the old small
  // hardcoded roster list.
  useEffect(() => {
    fetchAllSpeciesNames()
      .then((list) => setAllSpecies(list))
      .catch((err) => console.error(err))
      .finally(() => setAllSpeciesLoading(false));
  }, []);

  const team = side.teams[side.activeTeamIndex];
  const teamCount = side.teams.length;

  const selectSlot = (slotIndex) => {
    if (!team[slotIndex]) return; // empty boxes are picked via their own dropdown, not activated directly
    setSide((prev) => ({ ...prev, activeSlotIndex: slotIndex }));
  };

  const pickSpeciesForSlot = (slotIndex, slug) => {
    if (!slug) return;
    const newMon = { ...makeDefaultPokemon(slug), speciesLoading: true };

    setSide((prev) => {
      const newTeams = prev.teams.map((t, ti) =>
        ti === prev.activeTeamIndex ? t.map((s, si) => (si === slotIndex ? newMon : s)) : t
      );
      return { ...prev, teams: newTeams, activeSlotIndex: slotIndex };
    });

    fetchPokemon(slug)
      .then((data) => {
        setSide((prev) => {
          const newTeams = prev.teams.map((t, ti) =>
            ti === prev.activeTeamIndex
              ? t.map((s, si) =>
                  si === slotIndex && s?.speciesSlug === slug
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
                  si === slotIndex && s?.speciesSlug === slug
                    ? { ...s, speciesLoading: false, speciesError: err.message }
                    : s
                )
              : t
          );
          return { ...prev, teams: newTeams };
        });
      });
  };

  const addTeam = () => {
    setSide((prev) => ({
      ...prev,
      teams: [...prev.teams, makeTeam()],
      activeTeamIndex: prev.teams.length,
      activeSlotIndex: 0,
    }));
  };

  const removeSlot = (index) => {
    setSide((prev) => {
      const newTeams = prev.teams.map((t, ti) =>
        ti === prev.activeTeamIndex ? t.map((s, si) => (si === index ? null : s)) : t
      );
      const newTeam = newTeams[prev.activeTeamIndex];
      let newActiveSlotIndex = prev.activeSlotIndex;
      if (prev.activeSlotIndex === index) {
        const firstFilled = newTeam.findIndex((s) => s !== null);
        newActiveSlotIndex = firstFilled >= 0 ? firstFilled : 0;
      }
      return { ...prev, teams: newTeams, activeSlotIndex: newActiveSlotIndex };
    });
  };

  const gotoTeam = (delta) => {
    setSide((prev) => {
      const newIndex = Math.max(0, Math.min(prev.teams.length - 1, prev.activeTeamIndex + delta));
      const newTeam = prev.teams[newIndex];
      const firstFilled = newTeam.findIndex((s) => s !== null);
      return { ...prev, activeTeamIndex: newIndex, activeSlotIndex: firstFilled >= 0 ? firstFilled : 0 };
    });
  };

  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', fontSize: '0.8em', color: '#666' }}>
        <button
          onClick={() => gotoTeam(-1)}
          disabled={side.activeTeamIndex === 0}
          title="Previous team"
          style={{ cursor: side.activeTeamIndex === 0 ? 'default' : 'pointer', opacity: side.activeTeamIndex === 0 ? 0.3 : 1 }}
        >
          ‹
        </button>
        <span>Team {side.activeTeamIndex + 1} / {teamCount}</span>
        <button
          onClick={() => gotoTeam(1)}
          disabled={side.activeTeamIndex === teamCount - 1}
          title="Next team"
          style={{ cursor: side.activeTeamIndex === teamCount - 1 ? 'default' : 'pointer', opacity: side.activeTeamIndex === teamCount - 1 ? 0.3 : 1 }}
        >
          ›
        </button>
      </div>

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {Array.from({ length: TEAM_SIZE }).map((_, index) => {
          const slot = team[index];
          const isActive = side.activeSlotIndex === index;

          if (!slot) {
            return (
              <div
                key={index}
                title={allSpeciesLoading ? 'Loading species list...' : 'Pick a Pokémon for this slot'}
                style={{
                  width: `${BOX_SIZE}px`,
                  height: `${BOX_SIZE}px`,
                  border: '2px dashed #ccc',
                  borderRadius: '4px',
                  background: '#fafafa',
                  color: '#999',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {allSpeciesLoading ? (
                  '...'
                ) : (
                  <SearchableSelect
                    options={allSpecies}
                    value=""
                    onChange={(slug) => pickSpeciesForSlot(index, slug)}
                    placeholder="+"
                    triggerStyle={{ textAlign: 'center', fontSize: '16px', color: '#999' }}
                  />
                )}
              </div>
            );
          }

          const effectiveSpecies = getEffectiveSpecies(slot);

          return (
            <div
              key={index}
              onClick={() => selectSlot(index)}
              title={effectiveSpecies?.name || slugToLabel(slot.speciesSlug)}
              style={{
                position: 'relative',
                width: `${BOX_SIZE}px`,
                height: `${BOX_SIZE}px`,
                border: isActive ? '2px solid #3a4a6b' : '2px solid #ddd',
                borderRadius: '4px',
                background: isActive ? '#eef4ff' : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'visible',
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeSlot(index);
                }}
                title="Remove this Pokémon"
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#c33',
                  color: '#fff',
                  fontSize: '10px',
                  lineHeight: '16px',
                  padding: 0,
                  cursor: 'pointer',
                  zIndex: 1,
                }}
              >
                ×
              </button>
              <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {slot.speciesLoading && <span style={{ fontSize: '10px', color: '#999' }}>...</span>}
                {slot.speciesError && <span style={{ fontSize: '10px', color: '#c00' }}>!</span>}
                {effectiveSpecies?.sprite && (
                  <img src={effectiveSpecies.sprite} alt={effectiveSpecies.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
              </div>
            </div>
          );
        })}

        <button
          onClick={addTeam}
          title="Add a new team"
          style={{
            width: `${BOX_SIZE}px`,
            height: `${BOX_SIZE}px`,
            border: '2px dashed #999',
            borderRadius: '4px',
            background: '#f5f5f5',
            cursor: 'pointer',
            fontSize: '20px',
            color: '#666',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
