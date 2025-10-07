import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_GAME_MODE, type GameMode } from "@/lib/types";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ itemId: string }> },
) {
	const { itemId } = await params;
	const { searchParams } = new URL(request.url);
	const gameModeParam = searchParams.get("gameMode");
	const gameMode: GameMode = (gameModeParam as GameMode) || DEFAULT_GAME_MODE;

	try {
		// Determine the correct tooltip endpoint based on game mode
		let tooltipUrl: string;
		switch (gameMode) {
			case "classic":
				tooltipUrl = `https://nether.wowhead.com/classic/tooltip/item/${itemId}?json`;
				break;
			case "wotlk":
				tooltipUrl = `https://nether.wowhead.com/wotlk/tooltip/item/${itemId}?json`;
				break;
			case "cata":
				tooltipUrl = `https://nether.wowhead.com/cata/tooltip/item/${itemId}?json`;
				break;
			default:
				// Default to retail (retail value or any other value)
				tooltipUrl = `https://nether.wowhead.com/tooltip/item/${itemId}?json`;
				break;
		}

		// Fetch from Wowhead's tooltip API
		const response = await fetch(tooltipUrl, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; GuildBankViewer/1.0)",
			},
			next: { revalidate: 3600 }, // Cache for 1 hour
		});

		if (!response.ok) {
			return NextResponse.json(
				{ error: "Failed to fetch item data" },
				{ status: response.status },
			);
		}

		const data = await response.json();

		// Parse the tooltip data to extract structured information
		const parsedData = parseWowheadTooltip(data);

		return NextResponse.json(parsedData);
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

function parseWowheadTooltip(data: Record<string, unknown>) {
	// Extract basic info
	const name = data.name || "Unknown Item";
	const quality = data.quality || 0;
	const level = data.level || null;
	const classs = data.class || null;
	const subclass = data.subclass || null;
	const icon = data.icon || null;
	const iconName = data.icon || null;

	// Extract description (tooltip text)
	const description = data.tooltip || null;

	// Extract stats from tooltip
	const stats = extractStats(
		typeof data.tooltip === "string" ? data.tooltip : "",
	);

	// Extract sale price
	const salePrice = extractSalePrice(
		typeof data.tooltip === "string" ? data.tooltip : "",
	);

	// Extract item type/category
	const category = extractCategory(
		typeof data.tooltip === "string" ? data.tooltip : "",
		typeof classs === "string" ? classs : "",
		typeof subclass === "string" ? subclass : "",
	);

	return {
		name,
		quality,
		level,
		classs,
		subclass,
		icon,
		iconName,
		description,
		stats,
		salePrice,
		category,
	};
}

function extractStats(tooltip: string): string[] {
	if (!tooltip) return [];

	const stats: string[] = [];
	const lines = tooltip.split("\n");

	for (const line of lines) {
		const trimmed = line.trim();
		// Look for stat lines (usually contain + or - followed by numbers)
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

	// Look for "Sells for" or "Buy Price" patterns
	const priceMatch = tooltip.match(
		/(?:Sells for|Buy Price):\s*(\d+)\s*g\s*(\d+)\s*s\s*(\d+)\s*c/i,
	);
	if (priceMatch) {
		return {
			gold: parseInt(priceMatch[1]) || 0,
			silver: parseInt(priceMatch[2]) || 0,
			copper: parseInt(priceMatch[3]) || 0,
		};
	}

	// Try alternative patterns
	const altMatch = tooltip.match(/(\d+)\s*g\s*(\d+)\s*s\s*(\d+)\s*c/i);
	if (altMatch) {
		return {
			gold: parseInt(altMatch[1]) || 0,
			silver: parseInt(altMatch[2]) || 0,
			copper: parseInt(altMatch[3]) || 0,
		};
	}

	return null;
}

function extractCategory(
	tooltip: string,
	classs: string,
	subclass: string,
): string {
	if (classs && subclass) {
		return `${classs} - ${subclass}`;
	}
	if (classs) {
		return classs;
	}
	if (subclass) {
		return subclass;
	}

	// Try to extract from tooltip
	if (tooltip) {
		const lines = tooltip.split("\n");
		for (const line of lines) {
			const trimmed = line.trim();
			if (
				trimmed.match(
					/^(Weapon|Armor|Consumable|Container|Projectile|Quiver|Recipe|Miscellaneous)/i,
				)
			) {
				return trimmed;
			}
		}
	}

	return "Miscellaneous";
}
