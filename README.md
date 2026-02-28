# Battlefield 6 Air Superiority

Custom Battlefield Portal game mode focused on domination-style aerial objective control and a custom HUD/scoreboard workflow built in TypeScript.

## Overview

This project contains multiple iterations of the Air Superiority mode (`Airsup_v1` through `Airsup_v7`) showing progression from core scoring logic to a full custom HUD with dynamic score bars, live objective ownership indicators, refined HUD visuals, and integrated in-match team switching UX.

## Features

- Custom two-team scoreboard with player stats:
  - Score
  - Kills
  - Deaths
  - Captures
- Domination-style objective control scoring model:
  - 3 objectives held: score every 1 second
  - 2 objectives held: score every 5 seconds
  - 1 objective held: score every 10 seconds
- Per-player mirrored HUD perspective (friendly vs enemy)
- Dynamic team score bars (later versions)
- Objective state widgets (neutral/friendly/enemy in latest version)
- Triple-tap Interact (`E`) team-switch panel with Team 1/Team 2/Close controls
- Layered objective icon styling (outer/inner plates) for neutral, friendly, and enemy states

## Version Guide

- `code/Airsup_v1.ts`: Core mode logic and scoreboard tracking
- `code/Airsup_v2.ts`: Adds first HUD layer
- `code/Airsup_v3.ts`: Adds objective placeholder/letter UI
- `code/Airsup_v4.ts`: Stabilized HUD updates via authoritative state + setters
- `code/Airsup_v5.ts`: Adds dynamic score bar fill updates
- `code/Airsup_v6.ts`: Adds dynamic objective ownership icon states
- `code/Airsup_v7.ts`: Refines HUD visuals (readability, layering, and objective marker polish)
- `code/Airsup_v7 copy.ts`: v7 integration branch with team-switch panel, layered friendly/enemy icon treatment, and kill-tracking/scoreboard reliability updates

## Project Structure

```text
.
|-- code/
|   |-- Airsup_v1.ts ... Airsup_v7.ts
|   |-- Strings.json
|   |-- tsconfig.json
|   `-- (supporting framework/plugin files)
|-- dist/
|   |-- bundle.ts
|   `-- bundle.strings.json
|-- ProjectVersionsReadMe's/
|   |-- Airsup_v1.txt ... Airsup_v7.txt
|   |-- Airsup_versions_compare.txt
|   `-- AiReadMe_v4.txt
|-- package.json
`-- README.md
```

## Documentation Folder Breakdown

`ProjectVersionsReadMe's/` contains version-focused documentation files:

- `Airsup_v1.txt ... Airsup_v7.txt`
  - Per-version explanations of major blocks, functions, and `mod.*` usage.
- `Airsup_versions_compare.txt`
  - Side-by-side progression summary from v1 through v7.
- `AiReadMe_v4.txt`
  - Architecture notes and stability lessons captured during v4-era iteration.

## Localization Strings

- Source strings are defined in `code/Strings.json`
- Bundled output is written to `dist/bundle.strings.json`

## Development Notes

- Version explanation documents are included in the repository for reference.
- HUD architecture in later versions is designed around:
  - one-time widget creation
  - runtime setter updates (`SetUITextLabel`, `SetUIWidgetSize`, `SetUIWidgetVisible`)
  - per-player widget name mapping

## Ownership and Attribution

- Original project files by Ethan Mills include:
  - `code/Airsup_v1.ts` through `code/Airsup_v7.ts`
  - project-specific documentation files in the repository root and `ProjectVersionsReadMe's/`
- Supporting framework/template directories were sourced from:
  - `https://github.com/deluca-mike/bf6-portal-scripting-template`
- Team switch UI approach/templates were adapted from:
  - `https://github.com/The0zzy/BF6-Portal-TeamSwitchUI`
- See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for the full attribution and directory-level mapping.

## License / Copyright

Copyright (c) 2026 Ethan Mills for original project files.
Third-party files remain under their respective upstream licenses.
