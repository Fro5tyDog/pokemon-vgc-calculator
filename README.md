Four files — one is brand new, three replace existing files:

  src/components/MoveSelector.jsx     <- NEW FILE
  src/components/PokemonPanel.jsx     <- REPLACES existing file
  src/components/DamageCalculator.jsx <- REPLACES existing file
  src/components/DamageOutput.jsx     <- REPLACES existing file

damageCalculator.js, combatant.js, and pokeApi.js are untouched — leave
those as they are. Run npm start after copying.

## What changed

This is a layout change, not a math change (the spread-move fix from
last time is untouched and still in damageCalculator.js).

1. New MoveSelector.jsx renders the compact list from your screenshot —
   each Pokémon's 4 moves as rows with live min%-max% previews. This
   IS the move picker now: picking a move in a row's dropdown both sets
   it AND makes it active immediately (no separate radio button).
   Clicking anywhere else on an already-filled row switches to it as
   active without changing what move it holds, so you can flip between
   moves you've already set.

2. The "Moves" section that used to live below the stats table in
   PokemonPanel.jsx is gone entirely — moved up into MoveSelector at
   the top of the page instead, matching where the reference calculator
   puts it. PokemonPanel.jsx now only handles species/item/ability/
   nature/tera type/stats/crit — no move state at all anymore.

3. DamageOutput.jsx dropped the big card (colored border, grid boxes,
   HP bar) in favor of a plain text line + the roll list in parens,
   matching the reference's minimal style — e.g.:
   "0+ Atk Garchomp Rock Slide vs. 0 HP / 0 Def Garchomp: 15-18
   (8.2% - 9.8%) -- possible 11HKO"
   (15, 15, 16, 16, 16, 16, 16, 17, 17, 17, 17, 17, 17, 18, 18, 18)

4. Move-fetching logic (the full move list, and per-slot detail
   fetching) moved from PokemonPanel up into DamageCalculator.jsx,
   since MoveSelector now needs it instead. The full move list is also
   fetched once for both Pokémon instead of once each.

Page order top to bottom: title -> two move-selector lists side by
side -> the two damage result lines -> Pokémon 1 | Field | Pokémon 2.
