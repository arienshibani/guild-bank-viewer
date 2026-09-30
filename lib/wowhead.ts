import type { GameMode } from "@/lib/types";

export interface ItemData {
	name: string;
	quality: number;
	level: number | null;
	classs: string | null;
	subclass: string | null;
	icon: string | null;
	iconName: string | null;
	description: string | null;
	stats: string[];
	salePrice: { gold: number; silver: number; copper: number } | null;
	category: string;
}

/** Wowhead tooltip endpoint for an item in the given game mode. Unknown modes fall back to retail. */
export function tooltipUrl(itemId: string | number, gameMode: GameMode): string {
	switch (gameMode) {
		case "classic":
		case "wotlk":
		case "cata":
		case "mop-classic":
		case "forever":
			return `https://nether.wowhead.com/${gameMode}/tooltip/item/${itemId}?json`;
		default:
			return `https://nether.wowhead.com/tooltip/item/${itemId}?json`;
	}
}

/** Turn a raw Wowhead tooltip response into the structured item data the app uses. */
export function parseWowheadTooltip(data: Record<string, unknown>): ItemData {
	const tooltip = typeof data.tooltip === "string" ? data.tooltip : "";
	const classs = (data.class as string | undefined) || null;
	const subclass = (data.subclass as string | undefined) || null;
	const icon = (data.icon as string | undefined) || null;

	return {
		name: (data.name as string | undefined) || "Unknown Item",
		quality: (data.quality as number | undefined) || 0,
		level: (data.level as number | undefined) || null,
		classs,
		subclass,
		icon,
		iconName: icon,
		description: (data.tooltip as string | undefined) || null,
		stats: extractStats(tooltip),
		salePrice: extractSalePrice(tooltip),
		category: extractCategory(tooltip, classs ?? "", subclass ?? ""),
	};
}

function extractStats(tooltip: string): string[] {
	if (!tooltip) return [];

	const stats: string[] = [];
	for (const line of tooltip.split("\n")) {
		const trimmed = line.trim();
		// Stat lines usually start with +/- and a number, or "<n> Stamina" etc.
		if (
			trimmed.match(/^[+-]\d+/) ||
			trimmed.match(
				/^\d+\s+(Stamina|Strength|Agility|Intellect|Spirit|Armor|Damage|Healing)/i,
			)
		) {
			stats.push(trimmed);
		}
	}
	return stats;
}

function extractSalePrice(
	tooltip: string,
): { gold: number; silver: number; copper: number } | null {
	if (!tooltip) return null;

	const match =
		tooltip.match(
			/(?:Sells for|Buy Price):\s*(\d+)\s*g\s*(\d+)\s*s\s*(\d+)\s*c/i,
		) ?? tooltip.match(/(\d+)\s*g\s*(\d+)\s*s\s*(\d+)\s*c/i);
	if (!match) return null;

	return {
		gold: parseInt(match[1], 10) || 0,
		silver: parseInt(match[2], 10) || 0,
		copper: parseInt(match[3], 10) || 0,
	};
}

function extractCategory(
	tooltip: string,
	classs: string,
	subclass: string,
): string {
	if (classs && subclass) return `${classs} - ${subclass}`;
	if (classs) return classs;
	if (subclass) return subclass;

	for (const line of tooltip.split("\n")) {
		const trimmed = line.trim();
		if (
			trimmed.match(
				/^(Weapon|Armor|Consumable|Container|Projectile|Quiver|Recipe|Miscellaneous)/i,
			)
		) {
			return trimmed;
		}
	}

	return "Miscellaneous";
}
