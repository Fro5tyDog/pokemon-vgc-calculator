# Contributing to Pokémon Champions VGC Calculator

First off, thanks for considering contributing to this project! It's people like you that make this calculator such a great tool.

## Code of Conduct

Be respectful and inclusive. We're all here to build something cool.

## How Can I Contribute?

### Reporting Bugs

- **Check existing issues** first to avoid duplicates
- **Use a clear, descriptive title**
- **Include steps to reproduce** the bug
- **Explain the expected vs actual behavior**
- **Include screenshots/videos** if applicable
- **Test with known calculators** (Pikalytics, Trainer Tower, Pokémon Showdown)

### Suggesting Features

- **Use a clear, descriptive title**
- **Provide a step-by-step description** of the suggested feature
- **Explain why this would be useful** (especially for Phase 1/2 priorities)
- **List any similar features** in other tools

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Keep commits atomic** - one feature per commit when possible
3. **Write clear commit messages**
4. **Test against known damage calculators** before submitting
5. **Update docs** if you change behavior or add features
6. **No breaking changes** unless discussed in an issue first

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/pokemon-vgc-calculator.git
cd pokemon-vgc-calculator

# Install dependencies
npm install

# Start dev server
npm start

# Run tests (when available)
npm test
```

## Code Style

- Use **descriptive variable names** (not `a`, `b`, `x`)
- **Comment complex logic**, especially in damage calculations
- **Keep functions focused** on a single responsibility
- **Use arrow functions** for React components
- **Destructure props** in component parameters

### Example:

```jsx
// Good ❌
const DamageOutput = ({ result, minDmg, maxDmg, defenders }) => {
  // ...
}

// Better ✅
const DamageOutput = ({ result }) => {
  const { minDamage, maxDamage, defenderHP } = result;
  // ...
}
```

## Testing Changes

Before submitting a PR, verify your changes against multiple known calculators:

- [Pikalytics](https://pikalytics.com/calc)
- [Trainer Tower](https://www.trainertower.com/)
- [Pokémon Showdown](https://calc.pokemonshowdown.com/)

Document any edge cases you test.

## Documentation

- Update **README.md** if you change how to use the tool
- Add **comments** for complex calculations
- Include **examples** for new features
- Update the **roadmap** if adding a planned feature

## Areas We Need Help With

### High Priority
- **Mobile responsive design** - CSS/layout work
- **Team storage** - IndexedDB implementation
- **Expanding Pokémon data** - Adding all Gen 9 Pokémon/moves
- **Bug fixes** - Test against real damage and report issues

### Medium Priority
- **UI improvements** - Tailwind CSS styling
- **Export features** - JSON/shareable links
- **Better data organization** - Categorized move lists, etc.

### Future (Phase 2+)
- **EV optimization** - Algorithm for finding optimal spreads
- **Meta data** - Tournament results integration
- **Screenshot parsing** - OCR for team import

## Questions?

- **Open a discussion** on GitHub
- **Check existing issues** for similar questions
- **Join the Pokémon competitive community** (Smogon, Pikalytics) for meta knowledge

## Recognition

Contributors will be listed in the README.md. Major contributions will be highlighted!

---

Thanks for helping make competitive Pokémon more accessible! 🙌
