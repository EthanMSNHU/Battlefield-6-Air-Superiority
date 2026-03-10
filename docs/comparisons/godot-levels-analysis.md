# Godot Levels Analysis

This document summarizes the authored gameplay-layer work present in the `.spatial.json` files under `src/GodotLevels/`.

## Development View

Across all five files, the shipped Battlefield 6 terrain and environment assets remain in the `Static` section, while the custom Air Superiority gameplay work lives in `Portal_Dynamic`.

That means the project-level authoring work is primarily:

- objective placement
- capture-volume setup
- combat-area and map-bounds setup
- air and infantry spawn layout
- HQ spawn setup
- vehicle spawner layout
- HQ trigger integration
- competitive variant setup for jet-focused play

## Shared Structure

The three main `Airsup_*` files follow a very consistent full-mode pattern:

- `3` capture points with `ObjId` values `100`, `101`, `102`
- `1` map-bounds sector with `ObjId` `200`
- `1` combat-space polygon volume
- `32` spawn points
- `4` HQ player spawners
- `30` vehicle spawners
- `2` stationary emplacement spawners
- `2` HQ area triggers with `ObjId` values `104` and `105`

Those `104` / `105` trigger IDs align with the redzone logic used by the current `v7` game-mode script.

## Base Map References

Static environment ownership by file:

| File | Static Terrain / Asset Base |
|---|---|
| `Airsup_firestorm.spatial.json` | `MP_FireStorm_Terrain`, `MP_FireStorm_Assets` |
| `Airsup_LiberationPeak.spatial.json` | `MP_Capstone_Terrain`, `MP_Capstone_Assets` |
| `Airsup_mirak.spatial.json` | `MP_Tungsten_Terrain`, `MP_Tungsten_Assets` |
| `FireStormCompJetDF.spatial.json` | `MP_FireStorm_Terrain`, `MP_FireStorm_Assets` |
| `MirakCompJetDF.spatial.json` | `MP_Tungsten_Terrain`, `MP_Tungsten_Assets` |

## Full Air Sup Files

### `Airsup_firestorm.spatial.json`

- `Portal_Dynamic`: `102` objects
- `Static`: `2` objects
- Full Air Sup structure present
- Includes:
  - `3` capture points
  - `6` polygon volumes
  - `32` spawn points
  - `4` HQ player spawners
  - `30` vehicle spawners
  - `2` area triggers
  - `2` stationary emplacement spawners
- Vehicle mix:
  - `AH64 x18`
  - `F16 x10`
  - `F22 x2`

### `Airsup_LiberationPeak.spatial.json`

- `Portal_Dynamic`: `99` objects
- `Static`: `2` objects
- Full Air Sup structure present
- Includes:
  - `3` capture points
  - `6` polygon volumes
  - `32` spawn points
  - `4` HQ player spawners
  - `30` vehicle spawners
  - `2` area triggers
  - `2` stationary emplacement spawners
- Vehicle mix:
  - `AH64 x18`
  - `F16 x10`
  - `F22 x2`
- Naming note:
  - capture points use `CapturePoint_A`, `CapturePoint_B`, `CapturePoint_C`
  - object IDs still match the scripting expectations: `100`, `101`, `102`

### `Airsup_mirak.spatial.json`

- `Portal_Dynamic`: `105` objects
- `Static`: `2` objects
- Full Air Sup structure present
- Includes:
  - `3` capture points
  - `6` polygon volumes
  - `32` spawn points
  - `4` HQ player spawners
  - `30` vehicle spawners
  - `2` area triggers
  - `2` stationary emplacement spawners
- Vehicle mix:
  - `AH64 x18`
  - `F16 x10`
  - `F22 x2`
- Variation note:
  - contains `5` deploy cameras instead of `2`

## Competitive / Jet DF Files

### `FireStormCompJetDF.spatial.json`

- `Portal_Dynamic`: `88` objects
- `Static`: `2` objects
- Reduced competitive variant rather than full public Air Sup setup
- Includes:
  - `3` capture points
  - `6` polygon volumes
  - `32` spawn points
  - `4` HQ player spawners
  - `20` vehicle spawners
- Missing compared with the full Air Sup files:
  - HQ area triggers
  - stationary emplacement spawners
- Vehicle mix:
  - `F16 x10`
  - `F22 x10`

### `MirakCompJetDF.spatial.json`

- `Portal_Dynamic`: `83` objects
- `Static`: `2` objects
- Reduced competitive variant rather than full public Air Sup setup
- Includes:
  - `3` capture points
  - `32` spawn points
  - `4` HQ player spawners
  - `20` vehicle spawners
  - `2` stationary emplacement spawners
- Missing compared with the full Air Sup files:
  - HQ area triggers
  - visible sector / combat-area objects in the extracted type summary
- Vehicle mix:
  - `F16 x10`
  - `F22 x10`

## Design Conclusions

The files show two distinct development tracks:

1. Full Air Superiority map builds
- `Airsup_firestorm`
- `Airsup_LiberationPeak`
- `Airsup_mirak`

These include complete objective logic support, combat-space shaping, HQ enforcement hooks, and broader air-vehicle composition.

2. Competitive jet-focused variants
- `FireStormCompJetDF`
- `MirakCompJetDF`

These are leaner, more specialized layouts with reduced systems and a more symmetrical jet vehicle mix.

## What The Files Demonstrate

From a development standpoint, these `.spatial.json` files show that the project is not only a scripting effort. They capture authored gameplay-space work including:

- hand-built air and infantry spawn placement
- HQ spawn layout
- objective and capture-volume construction
- polygon-based map borders and control spaces
- vehicle respawner distribution
- redzone-support trigger placement
- per-map and competitive variant tuning

The code and the `.spatial.json` files together form the full Air Superiority project.
