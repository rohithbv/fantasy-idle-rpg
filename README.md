# Fantasy Idle RPG

A browser-based mobile idle clicker RPG with puzzle mini-games. Built with Phaser.js + TypeScript + Vite. Designed for smartphone browsers.

## Gameplay

- **Tap to earn gold** — click the crystal in Town to earn gold, with combo multipliers for rapid tapping
- **Buy upgrades** — increase click power, add auto-clickers, unlock equipment
- **Recruit heroes** — build a party of Warriors, Mages, Rangers, Clerics, and Thieves
- **Dungeon** — auto-battle through infinite floors with scaling enemies and boss fights every 10 floors
- **Micro-games** — play Match-3, Memory Match, and Simon Says to earn temporary gold multipliers and bonus gold
- **Prestige** — reset your run for Soul Shards, then spend them on permanent upgrades

## Tech Stack

| Tool | Version |
|------|---------|
| [Phaser.js](https://phaser.io) | 3.80.1 |
| TypeScript | 5.4 |
| Vite | 5.2 |

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in a browser. For mobile testing, open `http://<your-local-ip>:3000` on your phone (must be on the same network).

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── scenes/            # Phaser scenes (Town, Shop, Hero, Dungeon, Prestige, micro-games)
├── systems/           # Game logic (GameStateManager, IdleEngine, CombatSystem, etc.)
├── ui/                # Reusable UI components (HUD, Button, Modal, etc.)
├── data/              # Static game data (heroes, items, upgrades, enemies, balancing)
├── models/            # TypeScript interfaces (GameState, Hero, Item, etc.)
├── utils/             # Utilities (FormatNumber, Random, Time, etc.)
└── types/             # Enums and event types
```

## Scene Flow

```
Boot → Preload → MainMenu → TownScene (permanent hub)
                                  │
                   ┌──────┬───────┼────────┬──────────┐
                   ▼      ▼       ▼        ▼          ▼
                 Shop   Hero   Dungeon  MicroGame   Prestige
                                        Select
                                          │
                                 ┌────────┼────────┐
                                 ▼        ▼        ▼
                              Match3  Memory   Simon
                                      Match    Says
```

TownScene is the permanent base scene. All other scenes launch as overlays on top of it.

## Save System

Progress is saved automatically to `localStorage` every 30 seconds and whenever the tab loses focus. Offline earnings are calculated on load (50% efficiency, capped at 8 hours).

## Prestige

Unlock prestige after reaching Floor 20. Earn Soul Shards based on your highest floor and total gold earned. Spend shards on permanent upgrades that carry across runs (starting bonuses, permanent multipliers, extra party slots, extended offline cap).
