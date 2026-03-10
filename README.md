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
|   |       `-- team-swapper.ts
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

## Documentation

- `docs/versions/airsup-v1.md` through `docs/versions/airsup-v7.md`
- `docs/comparisons/airsup-versions-compare.md`

## Godot Level Files

- `src/GodotLevels/` stores exported map `.spatial.json` files for Air Sup map setups and related comparison/reference scenes
- Current tracked files include Firestorm, Liberation Peak, Mirak, and comp variants used during map setup iteration

## Localization Strings

- Source strings for the Air Sup builds are defined in `src/GameModeCode/airsup/entrypoints/strings.json`
- Bundled output is written to `dist/bundle.strings.json`

## Build

- `npm run build` builds the main `v7` entrypoint
- `npm run build:v7-tuning` builds the tuning branch
- `npm run build:v4` builds the `v4` milestone version

## Development Notes

- Later HUD versions are designed around one-time widget creation and runtime setter updates.
- `reference/` is intentionally separated from `src/` so reference scripts do not sit beside active production files.

## Ownership and Attribution

- Original project files by Ethan Mills include `src/GameModeCode/airsup/`, `src/GameModeCode/variants/`, and `docs/`
- Supporting framework/template directories were sourced from `https://github.com/deluca-mike/bf6-portal-scripting-template`
- Team switch UI approach/templates were adapted from `https://github.com/The0zzy/BF6-Portal-TeamSwitchUI`
- See `THIRD_PARTY_NOTICES.md` for the full attribution mapping

## License / Copyright

Copyright (c) 2026 Ethan Mills for original project files.
Third-party files remain under their respective upstream licenses.
