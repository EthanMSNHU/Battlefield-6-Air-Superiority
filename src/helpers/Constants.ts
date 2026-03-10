export const Colours = {
    FRIENDLY_BG: mod.CreateVector(0.12, 0.39, 0.88),
    FRIENDLY_TEXT: mod.CreateVector(0.86, 0.93, 1.0),
    ENEMY_BG: mod.CreateVector(0.82, 0.18, 0.16),
    ENEMY_TEXT: mod.CreateVector(1.0, 0.9, 0.9),
    BLACK: mod.CreateVector(0.0, 0.0, 0.0),
    WHITE: mod.CreateVector(1.0, 1.0, 1.0)
} as const;

export const GameVariables = {
    STARTING_SCORE: 1000
} as const;
