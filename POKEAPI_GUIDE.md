# Using PokeAPI to Expand Your Pokémon Database

This guide explains how to fetch all Pokémon and move data from PokeAPI and use it in your calculator.

## Quick Start

1. **Run the data generation script:**
   ```bash
   node scripts/generatePokeData.js
   ```

2. **Wait for it to complete** (takes ~3-5 minutes for all 1000+ Pokémon)
   - The script shows progress every 50 Pokémon
   - It's respectful to PokeAPI with delays between requests

3. **Result:** `src/data/pokeApiData.json` containing all Pokémon and moves

## How to Use the Generated Data

### Option 1: Import as JSON (Recommended)

```javascript
// In your components
import pokeApiData from '../data/pokeApiData.json';

// Access Pokémon data
const basculegion = pokeApiData.pokemon['basculegion'];
console.log(basculegion.types); // ['Water', 'Ghost']
console.log(basculegion.baseStats.spa); // 107
console.log(basculegion.sprite); // URL to official artwork
```

### Option 2: Merge with Existing gameData.js

```javascript
// src/data/gameData.js
import pokeApiData from './pokeApiData.json';

export const POKEMON = {
  ...pokeApiData.pokemon,
  // Your custom/hardcoded ones still work
};

export const MOVES = {
  ...pokeApiData.moves,
  // Add custom moves if needed
};
```

## What Gets Generated

### Pokémon Object
```json
{
  "basculegion": {
    "name": "Basculegion",
    "types": ["Water", "Ghost"],
    "baseStats": {
      "hp": 101,
      "atk": 92,
      "def": 65,
      "spa": 107,
      "spd": 80,
      "spe": 78
    },
    "sprite": "https://raw.githubusercontent.com/PokeAPI/sprites/master/..."
  }
}
```

### Move Object
```json
{
  "close-combat": {
    "name": "Close Combat",
    "type": "Fighting",
    "category": "Physical",
    "basePower": 120,
    "accuracy": 100
  }
}
```

## Customizing the Script

### Add More Moves

Edit `scripts/generatePokeData.js` and expand the `commonMoveIds` array:

```javascript
const commonMoveIds = [
  'close-combat',
  'earthquake',
  'stone-edge',
  // Add more move IDs here
  'my-custom-move',
];
```

### Fetch Specific Generations

Change `START_ID` and `END_ID`:

```javascript
// Gen 1 only (Kanto)
const START_ID = 1;
const END_ID = 151;

// Gen 9 only (Paldea)
const START_ID = 906;
const END_ID = 1025;
```

### Adjust Request Speed

If PokeAPI is slow, increase the delay:

```javascript
const DELAY_MS = 200; // Wait 200ms between requests instead of 100ms
```

## Fetching Abilities

The script currently doesn't fetch abilities, but you can add it:

```javascript
async function fetchAbility(abilityId) {
  const response = await fetch(`https://pokeapi.co/api/v2/ability/${abilityId}`);
  const data = await response.json();
  return {
    name: data.name,
    effect: data.effect_entries[0]?.effect,
  };
}
```

## Using Sprites in Your UI

Now that you have sprite URLs, you can display Pokémon images:

```jsx
function PokemonDisplay({ pokemonName }) {
  const pokemon = pokeApiData.pokemon[pokemonName];
  
  return (
    <div>
      <img 
        src={pokemon.sprite} 
        alt={pokemon.name}
        style={{ width: '150px' }}
      />
      <h3>{pokemon.name}</h3>
      <p>Types: {pokemon.types.join(', ')}</p>
    </div>
  );
}
```

## Troubleshooting

### "Failed to fetch" messages
- Check your internet connection
- PokeAPI might be temporarily down
- Run the script again

### Script is too slow
- Increase `DELAY_MS` for faster requests (at risk of rate limiting)
- Run during off-peak hours

### Missing Pokémon
- Some alternate forms aren't included by default
- Edit the script to fetch specific forms separately

## File Size Note

- **All 1000+ Pokémon**: ~2.5MB
- **Common moves only**: Adds ~50KB
- **With all moves**: ~500KB additional

Consider splitting into separate files if it gets too large:
- `pokeApiData.pokemon.json`
- `pokeApiData.moves.json`
- `pokeApiData.abilities.json`

## Next Steps

1. Generate the data: `node scripts/generatePokeData.js`
2. Update your components to use the new data
3. Add Pokémon images to your UI
4. Expand move database with more competitive moves
5. Consider adding ability data

---

For more info, visit [PokeAPI.co](https://pokeapi.co)
