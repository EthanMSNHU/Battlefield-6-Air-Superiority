# Battlefield 6 Air Superiority

Custom Battlefield Portal game mode project focused on aerial objective control, custom HUD systems, and iterative TypeScript mode development.

## Overview

This repository now follows a cleaner source layout:

- `src/` contains active source code and supporting framework files
- `src/GodotLevels/` contains exported `.spatial.json` level files used for map iteration/reference
- `docs/` contains version notes and comparison docs
- `dist/` contains generated bundle output
- `reference/` contains non-production reference scripts kept separate from active source

The main Air Superiority mode evolves from `v1` through `v7`, with standalone variants for radar and team switching, plus a dedicated working branch for live tuning.

This project is functionally inspired by Battlefield 4's Air Superiority mode: air-only objective control, aerial map flow, and objective-based scoring rather than pure kill-based dogfighting. The implementation here adapts that design into Battlefield 6 Portal tooling and custom scripting.

## Features

- Custom two-team scoreboard with `Score`, `Kills`, `Deaths`, and `Captures`
- Domination-style objective control scoring
- Per-player mirrored HUD perspective
- Dynamic team score bars
- Objective state widgets for neutral, friendly, and enemy ownership
- Triple-tap Interact (`E`) team-switch panel
- Live capture-progress HUD
- Enemy HQ redzones using AreaTriggers `104` and `105`
- Redzone warning overlay and timed destruction enforcement
- Battlefield 4 Air Superiority-inspired objective control design adapted for Battlefield 6 Portal
- Support for custom air-sup map setups built from Battlefield 6 base maps through Godot `.spatial.json` level files

## Source Layout

```text
.
|-- src/
|   |-- GameModeCode/
|   |   |-- airsup/
|   |   |   |-- entrypoints/
|   |   |   |   |-- v4.ts
|   |   |   |   |-- v7.ts
|   |   |   |   |-- v7-tuning.ts
|   |   |   |   `-- strings.json
|   |   |   |-- versions/
|   |   |   |   |-- v1.ts
|   |   |   |   |-- v2.ts
|   |   |   |   |-- v3.ts
|   |   |   |   |-- v4.ts
|   |   |   |   |-- v5.ts
|   |   |   |   |-- v6.ts
|   |   |   |   `-- v7.ts
|   |   |   `-- working/
|   |   |       `-- v7-tuning.ts
|   |   `-- variants/
|   |       |-- air-radar.ts
|   |       |-- captureProgressHudHelpers.ts
|   |       |-- gameModeVariables.ts
|   |       |-- hudCreation.ts
|   |       |-- hudUpdates.ts
|   |       |-- initializeGameMode.ts
|   |       |-- objectiveIconUpdates.ts
|   |       |-- playerEvents.ts
|   |       |-- redZoneHelpers.ts
|   |       |-- scoreboard.ts
|   |       |-- team-swapper.ts
|   |       |-- teamScoring.ts
|   |       `-- teamSwitchUi.ts
|   |-- GodotLevels/
|   |   |-- Airsup_firestorm.spatial.json
|   |   |-- Airsup_LiberationPeak.spatial.json
|   |   |-- Airsup_mirak.spatial.json
|   |   |-- FireStormCompJetDF.spatial.json
|   |   `-- MirakCompJetDF.spatial.json
|   |-- bf6-portal-utils/
|   |-- game/
|   |-- gdconverter/
|   |-- gdplugins/
|   |-- helpers/
|   |-- modlib/
|   `-- types/
|-- docs/
|   |-- versions/
|   `-- comparisons/
|-- dist/
|   |-- bundle.ts
|   `-- bundle.strings.json
|-- reference/
|   `-- twl-vehicles-only-script.ts
|-- package.json
|-- tsconfig.json
`-- README.md
```

## Version Guide

- `src/GameModeCode/airsup/versions/v1.ts`: Core mode logic and scoreboard tracking
- `src/GameModeCode/airsup/versions/v2.ts`: First HUD layer
- `src/GameModeCode/airsup/versions/v3.ts`: Objective placeholder and letter UI
- `src/GameModeCode/airsup/versions/v4.ts`: Authoritative score state plus setter-based HUD updates
- `src/GameModeCode/airsup/versions/v5.ts`: Dynamic score bar fills
- `src/GameModeCode/airsup/versions/v6.ts`: Objective ownership icon states
- `src/GameModeCode/airsup/versions/v7.ts`: Main full-feature version
- `src/GameModeCode/airsup/working/v7-tuning.ts`: Active tuning branch of v7
- `src/GameModeCode/airsup/entrypoints/`: Build entrypoints and shared Air Sup `strings.json`
- `src/GameModeCode/variants/air-radar.ts`: Standalone radar-focused variant
- `src/GameModeCode/variants/team-swapper.ts`: Standalone team-switch-focused variant
- `src/GameModeCode/variants/*.ts`: Direct copy-out reference files from `v7` split by major function/region block

## Documentation

- `docs/versions/airsup-v1.md` through `docs/versions/airsup-v7.md`
- `docs/comparisons/airsup-versions-compare.md`

## Godot Level Files

- `src/GodotLevels/` stores exported map `.spatial.json` files for Air Sup map setups and related comparison/reference scenes
- Current tracked files include Firestorm, Liberation Peak, Mirak, and comp variants used during map setup iteration
- These files represent the level-design side of the project: Battlefield 6 base maps were taken as the environment foundation, then custom Air Superiority gameplay layers were built on top
- Project-authored map work includes hand-built air and infantry spawn locations using asset-library content, HQ spawn setup, objective placement, vehicle respawners, play-space setup, and overall air-combat flow needed to make the mode playable from scratch
- Polygon-based gameplay volumes were used to define map borders, HQ areas, and objective spaces, giving each Air Superiority layout its custom playable structure
- The underlying environmental art and base terrain come from the shipped Battlefield 6 maps; the custom design work in this repository is the game-mode layout and aerial combat structure added through Godot and Portal-compatible spatial files

## Air Superiority Design Basis

- Battlefield 4 Air Superiority was built around aircraft-only objective control rather than infantry-focused conquest flow
- The mode emphasized controlling aerial capture spaces and winning through airspace control, not only pilot kill counts
- Most Battlefield 4 implementations used three objectives, while some map variants changed vehicle type or objective structure
- That design philosophy directly informs this project: large-scale aerial control, map-specific vehicle flow, and custom objective/spawn placement built to support dedicated Air Superiority gameplay

## Localization Strings

- Source strings for the Air Sup builds are defined in `src/GameModeCode/airsup/entrypoints/strings.json`
- Bundled output is written to `dist/bundle.strings.json`

## Development Notes

- Later HUD versions are designed around one-time widget creation and runtime setter updates.
- `reference/` is intentionally separated from `src/` so reference scripts do not sit beside active production files.
- The extra `src/GameModeCode/variants/` Air Sup files are literal copy/paste extracts from `v7` for reference and reuse; they are not refactored standalone modules.
- The code and level files together make up the project: TypeScript handles game rules, HUD, scoring, and event logic, while the Godot `.spatial.json` files define the custom playable Air Superiority layouts built on top of Battlefield 6 maps.

## Ownership and Attribution

- Original project files by Ethan Mills include `src/GameModeCode/airsup/`, `src/GameModeCode/variants/`, and `docs/`
- Supporting framework/template directories were sourced from `https://github.com/deluca-mike/bf6-portal-scripting-template`
- Team switch UI approach/templates were adapted from `https://github.com/The0zzy/BF6-Portal-TeamSwitchUI`
- See `THIRD_PARTY_NOTICES.md` for the full attribution mapping

## License / Copyright

Copyright (c) 2026 Ethan Mills for original project files.
Third-party files remain under their respective upstream licenses.
