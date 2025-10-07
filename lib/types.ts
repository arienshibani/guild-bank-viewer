// Game mode types for World of Warcraft versions
export type GameMode = "retail" | "classic" | "wotlk" | "cata";

// Game mode display names for UI
export const GAME_MODE_LABELS: Record<GameMode, string> = {
	retail: "Retail",
	classic: "Classic",
	wotlk: "Wrath of the Lich King",
	cata: "Cataclysm",
} as const;

// Default game mode
export const DEFAULT_GAME_MODE: GameMode = "classic";

// Array of all game modes for iteration
export const GAME_MODES: GameMode[] = ["retail", "classic", "wotlk", "cata"];
