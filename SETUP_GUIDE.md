# Getting Started: From Local to GitHub

## Project Overview

You now have a **fully functional Pokémon Champions damage calculator** ready to be deployed!

### What's Included

```
pokemon-vgc-calculator/
├── src/
│   ├── components/
│   │   ├── DamageCalculator.jsx      # Main layout + state
│   │   ├── PokemonPanel.jsx          # Pokémon config UI
│   │   └── DamageOutput.jsx          # Damage results display
│   ├── utils/
│   │   └── damageCalculator.js       # Core damage calculation
│   ├── data/
│   │   └── gameData.js               # Pokémon/moves/items/abilities/types
│   ├── App.jsx
│   └── index.js
├── public/
│   └── index.html
├── package.json
├── README.md
├── CONTRIBUTING.md
├── .gitignore
└── SETUP_GUIDE.md (this file)
```

## Step 1: Local Testing

Before pushing to GitHub, test locally:

```bash
# Navigate to project directory
cd pokemon-vgc-calculator

# Install dependencies
npm install

# Start dev server
npm start
```

You should see the calculator running at `http://localhost:3000`

### Test These Scenarios
1. Select different Pokémon (Basculegion, Kingambit, Garchomp)
2. Change moves and see damage update
3. Adjust EVs/IVs and verify stat changes
4. Enable critical hits
5. Change field conditions

**Verify against known calculators:**
- Try a matchup on Pikalytics and compare results
- Test with different items/abilities

## Step 2: Create GitHub Repository

1. Go to [GitHub.com](https://github.com/new)
2. Create a new repository:
   - **Name**: `pokemon-vgc-calculator` (or similar)
   - **Description**: "Open-source competitive Pokémon Champions VGC damage calculator"
   - **Visibility**: Public
   - **DO NOT** initialize with README (you already have one)
   - **DO NOT** add .gitignore (you already have one)

3. Click "Create repository"

## Step 3: Push to GitHub

After creating the repo, GitHub will show you setup instructions. Here's the simplified version:

```bash
# From your project directory:
git init
git add .
git commit -m "Initial commit: Core damage calculator with Gen 9 mechanics"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/pokemon-vgc-calculator.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

## Step 4: Enable GitHub Features

### Add Topics
Go to repo Settings → About → Topics, add:
- `pokemon`
- `vgc`
- `damage-calculator`
- `competitive`
- `scarlet-violet`
- `open-source`

### Add Collaborators
Go to Settings → Collaborators → Add people
- Invite contributors who will help build features

### Enable Discussions (Optional)
Settings → Features → Enable Discussions
This lets collaborators discuss features without cluttering issues

## Step 5: Publish to Web (GitHub Pages)

Once ready, you can deploy the built app:

```bash
# Install gh-pages package
npm install --save-dev gh-pages

# Add to package.json:
# "homepage": "https://YOUR-USERNAME.github.io/pokemon-vgc-calculator",
# "scripts": {
#   "predeploy": "npm run build",
#   "deploy": "gh-pages -d build"
# }

# Deploy
npm run deploy
```

Then enable GitHub Pages:
- Settings → Pages
- Set Source to "Deploy from a branch"
- Select `gh-pages` branch

The app will be live at: `https://YOUR-USERNAME.github.io/pokemon-vgc-calculator`

## Next Steps (What to Build)

### Immediate Priorities
1. **Expand Pokémon Data**: Add all 1000+ Gen 9 Pokémon
2. **Mobile Responsive**: Add responsive CSS (start with CSS Grid)
3. **Bug Testing**: Compare against Pikalytics for edge cases
4. **Team Storage**: Implement IndexedDB for saving teams

### After MVP
1. **EV Optimizer**: Algorithm to find optimal spreads
2. **Meta Database**: Scrape tournament results
3. **Screenshot Import**: Add OCR for team import

## File Size Note

The current setup is **very lightweight**:
- ~50KB of code
- ~5KB of game data (expandable)
- Can easily support full Gen 9 with organized data structure

As you grow the Pokémon database, consider:
- Splitting data by generation
- Lazy loading moves/abilities
- Using a separate data CDN (optional)

## Troubleshooting

**Dependencies not installing?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Port 3000 already in use?**
```bash
npm start -- --port 3001
```

**Git command not working?**
Make sure you have Git installed: `git --version`

## Resources for Contributors

When you open this to collaborators, point them to:
- **README.md** - Overview and features
- **CONTRIBUTING.md** - How to contribute
- **src/utils/damageCalculator.js** - Code comments explain the formula

## Questions?

Document design decisions in:
- **GitHub Issues** - For feature discussions
- **GitHub Discussions** - For brainstorming
- **Pull Request descriptions** - Explain why changes were made

---

**You're all set!** 🚀

Your calculator has:
✅ Accurate damage math
✅ Full stat control
✅ Field conditions support
✅ Clean, extensible code
✅ Comprehensive documentation
✅ Ready for collaborators

Now go push it to GitHub and start building! 🎉
