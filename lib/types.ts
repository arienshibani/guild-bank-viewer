// Game mode types for World of Warcraft versions
export type GameMode = "retail" | "classic" | "wotlk" | "cata" | "mop-classic";

// Game mode display names for UI
export const GAME_MODE_LABELS: Record<GameMode, string> = {
	retail: "Retail",
	classic: "Classic",
	wotlk: "Wrath of the Lich King",
	cata: "Cataclysm",
	"mop-classic": "Mists of Pandaria",
} as const;

// Default game mode
export const DEFAULT_GAME_MODE: GameMode = "classic";

// Array of all game modes for iteration
export const GAME_MODES: GameMode[] = [
	"retail",
	"classic",
	"wotlk",
	"cata",
	"mop-classic",
];

// Bag types and their slot counts
export interface BagType {
	id: string; // wowhead ID as string. Necessary to fetch tooltip and icon.
	name: string;
	slots: number;
	itemId: number; // WoW item ID for the bag
	quality: number; // Item quality (0-7)
	description: string;
}

// Available bag types in WoW
export const BAG_TYPES: BagType[] = [
	// Normal / crafted / vendor bags
	{
		id: "2589",
		name: "Linen Bag",
		slots: 6,
		itemId: 2589,
		quality: 1,
		description: "Crafted linen-cloth bag",
	},
	{
		id: "2592",
		name: "Red Linen Bag",
		slots: 6,
		itemId: 2592,
		quality: 1,
		description: "Crafted dyed linen bag",
	},
	{
		id: "2934",
		name: "Kodo Hide Bag",
		slots: 6,
		itemId: 2934,
		quality: 1,
		description: "Leatherworking bag from kodo hides",
	},
	{
		id: "2997",
		name: "Woolen Bag",
		slots: 8,
		itemId: 2997,
		quality: 1,
		description: "Crafted wool-cloth bag",
	},
	{
		id: "3467",
		name: "Green Woolen Bag",
		slots: 8,
		itemId: 3467,
		quality: 1,
		description: "Dyed wool bag",
	},
	{
		id: "3468",
		name: "Red Woolen Bag",
		slots: 8,
		itemId: 3468,
		quality: 1,
		description: "Dyed wool bag",
	},
	{
		id: "5503",
		name: "Small Silk Pack",
		slots: 10,
		itemId: 5503,
		quality: 1,
		description: "Crafted silk / leather bag",
	},
	{
		id: "5765",
		name: "Mageweave Bag",
		slots: 12,
		itemId: 5765,
		quality: 2,
		description: "Crafted mageweave-cloth bag",
	},
	{
		id: "5770",
		name: "Red Mageweave Bag",
		slots: 12,
		itemId: 5770,
		quality: 2,
		description: "Dyed mageweave bag",
	},
	{
		id: "5764",
		name: "Black Silk Pack",
		slots: 10,
		itemId: 5764,
		quality: 1,
		description: "Crafted black silk / leather bag",
	},
	{
		id: "4342",
		name: "Heavy Brown Bag",
		slots: 10,
		itemId: 4342,
		quality: 1,
		description: "Vendor-sold brown bag",
	},
	{
		id: "7370",
		name: "Runecloth Bag",
		slots: 14,
		itemId: 7370,
		quality: 2,
		description: "Crafted runecloth bag",
	},
	{
		id: "10050",
		name: "Moonglow Vest Bag / “Mooncloth Bag”",
		slots: 16,
		itemId: 10050,
		quality: 3,
		description: "Mooncloth / high cloth bag",
	},
	{
		id: "34232",
		name: "Bottomless Bag",
		slots: 18,
		itemId: 34232,
		quality: 4,
		description: "Extensive storage bag (rare / raid drop)",
	},

	// Quest / drop / special bags
	{
		id: "5606",
		name: "Captain Sanders' Booty Bag",
		slots: 8,
		itemId: 5606,
		quality: 1,
		description: "Quest reward bag",
	},
	{
		id: "5763",
		name: "Gunnysack of the Night Watch",
		slots: 10,
		itemId: 5763,
		quality: 1,
		description: "Quest reward bag",
	},
	{
		id: "5744",
		name: "Ooze-covered Bag",
		slots: 10,
		itemId: 5744,
		quality: 1,
		description: "Quest reward / drop bag",
	},
	{
		id: "7371",
		name: "Explorer’s Knapsack",
		slots: 14,
		itemId: 7371,
		quality: 2,
		description: "Quest reward bag from Cortello’s riddle",
	},
	{
		id: "7372",
		name: "Thawpelt Sack",
		slots: 14,
		itemId: 7372,
		quality: 2,
		description: "Quest reward from Uldaman disc quest",
	},
	{
		id: "7373",
		name: "Demon Hide Sack",
		slots: 16,
		itemId: 7373,
		quality: 3,
		description: "Quest reward (You Are Rakh’likh, Demon)",
	},
	{
		id: "11017",
		name: "Supply Bag",
		slots: 18,
		itemId: 11017,
		quality: 1,
		description: "Quest / turn-in bag (Argent Dawn supplies)",
	},
	{
		id: "21340",
		name: "Panther Hide Sack",
		slots: 18,
		itemId: 21340,
		quality: 4,
		description: "Dropped in Zul’Gurub",
	},
	{
		id: "21342",
		name: "Onyxia Hide Backpack",
		slots: 18,
		itemId: 21342,
		quality: 4,
		description: "Onyxia boss drop bag",
	},

	// (You could also include profession / soul / ammo bags if desired)
	// e.g.
	// { id: "2300", name: "Small Shot Pouch", slots: 8, itemId: 2300, quality: 1, description: "Ammo bag (bullets)" },
	// { id: "2304", name: "Light Quiver", slots: 6, itemId: 2304, quality: 1, description: "Quiver (arrows)" },
	// { id: "16317", name: "Soul Pouch", slots: 20, itemId: 16317, quality: 3, description: "Warlock Soul bag" },
];

// Bank slot configuration
export interface BankSlotConfig {
	slotIndex: number; // 0-5 for the 6 configurable slots
	bagTypeId: string; // ID of the assigned bag type
}

// Default bank slot configuration (all empty)
export const DEFAULT_BANK_SLOT_CONFIG: BankSlotConfig[] = Array.from(
	{ length: 6 },
	(_, i) => ({
		slotIndex: i,
		bagTypeId: "none",
	}),
);
