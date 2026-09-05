/**
 * Script to generate Pokémon data from PokeAPI
 * Usage: node scripts/generatePokeData.js
 * 
 * This fetches all Gen 9 Pokémon and generates a JSON file
 * You can then import and use it in your gameData.js
 */

const fs = require('fs');
const path = require('path');

// Gen 9 includes Pokémon from #1 (Bulbasaur) to #1025 (Pecharunt)
// You can adjust START_ID and END_ID for different generations
const START_ID = 1;
const END_ID = 1025;

const DELAY_MS = 100; // Delay between requests to be respectful to PokeAPI

// Sleep function to add delay between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Stat index mapping from PokeAPI
const STAT_NAMES = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

async function fetchPokemon(id) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!response.ok) {
      console.warn(`Failed to fetch Pokémon ${id}`);
      return null;
    }
    
    const data = await response.json();
    
    // Build base stats object
    const baseStats = {};
    data.stats.forEach((stat, index) => {
      baseStats[STAT_NAMES[index]] = stat.base_stat;
    });
    
    // Get types
    const types = data.types
      .sort((a, b) => a.slot - b.slot)
      .map(t => {
        // Capitalize first letter
        const name = t.type.name;
        return name.charAt(0).toUpperCase() + name.slice(1);
      });
    
    // Get official artwork sprite
    const sprite = data.sprites?.other?.['official-artwork']?.front_default || '';
    
    return {
      id,
      name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
      types,
      baseStats,
      sprite,
      pokeapiName: data.name, // Store lowercase for API lookups
    };
  } catch (error) {
    console.error(`Error fetching Pokémon ${id}:`, error.message);
    return null;
  }
}

async function fetchAllPokemon() {
  const pokemonData = {};
  const failedIds = [];
  
  console.log(`Fetching Pokémon ${START_ID}-${END_ID} from PokeAPI...`);
  console.log('(This may take a few minutes)\n');
  
  for (let id = START_ID; id <= END_ID; id++) {
    const pokemon = await fetchPokemon(id);
    
    if (pokemon) {
      // Use lowercase name as key for consistency
      pokemonData[pokemon.pokeapiName] = {
        name: pokemon.name,
        types: pokemon.types,
        baseStats: pokemon.baseStats,
        sprite: pokemon.sprite,
      };
      
      if (id % 50 === 0) {
        console.log(`✓ Fetched ${id}/${END_ID} Pokémon`);
      }
    } else {
      failedIds.push(id);
    }
    
    // Be respectful to PokeAPI
    await sleep(DELAY_MS);
  }
  
  console.log(`\n✓ Fetched ${Object.keys(pokemonData).length} Pokémon`);
  
  if (failedIds.length > 0) {
    console.warn(`⚠ Failed to fetch ${failedIds.length} Pokémon: ${failedIds.join(', ')}`);
  }
  
  return pokemonData;
}

async function fetchMove(moveId) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/move/${moveId}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      name: data.name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      type: data.type?.name?.charAt(0).toUpperCase() + data.type?.name?.slice(1) || 'Normal',
      category: data.damage_class?.name?.charAt(0).toUpperCase() + 
                data.damage_class?.name?.slice(1) || 'Physical',
      basePower: data.power || 0,
      accuracy: data.accuracy || 100,
    };
  } catch (error) {
    return null;
  }
}

async function fetchCommonMoves() {
  // Fetch some common competitive moves (you can expand this list)
  const commonMoveIds = [
    'close-combat', 'earthquake', 'stone-edge', 'sucker-punch', 'shadow-sneak',
    'fluid-motion', 'ice-beam', 'thunderbolt', 'psychic', 'dazzling-gleam',
    'flamethrower', 'dragon-dance', 'swords-dance', 'calm-mind', 'nasty-plot',
    'stealth-rock', 'protect', 'helping-hand', 'follow-me', 'tailwind',
  ];
  
  const movesData = {};
  
  console.log('\nFetching common moves...');
  
  for (const moveId of commonMoveIds) {
    const move = await fetchMove(moveId);
    if (move) {
      movesData[moveId] = move;
    }
    await sleep(50);
  }
  
  console.log(`✓ Fetched ${Object.keys(movesData).length} moves`);
  
  return movesData;
}

async function generateGameData() {
  try {
    const pokemonData = await fetchAllPokemon();
    const movesData = await fetchCommonMoves();
    
    // Create the output object
    const gameData = {
      pokemon: pokemonData,
      moves: movesData,
      generatedAt: new Date().toISOString(),
      notes: 'Generated from PokeAPI. Use pokemon keys (lowercase) to access data.',
    };
    
    // Save to JSON file
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'pokeApiData.json');
    fs.writeFileSync(outputPath, JSON.stringify(gameData, null, 2));
    
    console.log(`\n✓ Successfully saved data to: src/data/pokeApiData.json`);
    console.log(`\nYou can now use this data in your calculator:`);
    console.log(`\n  import pokeApiData from './data/pokeApiData.json';`);
    console.log(`  const pokemon = pokeApiData.pokemon['basculegion'];`);
    
  } catch (error) {
    console.error('Error generating game data:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  generateGameData();
}

module.exports = { fetchPokemon, fetchMove, fetchAllPokemon, fetchCommonMoves };
