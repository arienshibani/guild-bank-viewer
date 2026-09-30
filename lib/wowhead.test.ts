import { describe, expect, it } from "vitest";
import { parseWowheadTooltip, tooltipUrl } from "./wowhead";

describe("tooltipUrl", () => {
	it("uses a game-mode path for classic-era modes", () => {
		expect(tooltipUrl(19019, "classic")).toBe(
			"https://nether.wowhead.com/classic/tooltip/item/19019?json",
		);
		expect(tooltipUrl("1", "wotlk")).toContain("/wotlk/tooltip/item/1");
		expect(tooltipUrl("1", "cata")).toContain("/cata/tooltip/item/1");
	});
	it("uses the unprefixed endpoint for retail", () => {
		expect(tooltipUrl(19019, "retail")).toBe(
			"https://nether.wowhead.com/tooltip/item/19019?json",
		);
	});
});

describe("parseWowheadTooltip", () => {
	it("keeps name, quality and icon", () => {
		const item = parseWowheadTooltip({
			name: "Thunderfury",
			quality: 5,
			icon: "inv_sword_39",
			tooltip: "<table></table>",
		});
		expect(item).toMatchObject({
			name: "Thunderfury",
			quality: 5,
			icon: "inv_sword_39",
			iconName: "inv_sword_39",
			description: "<table></table>",
		});
	});
	it("falls back to defaults for an empty response", () => {
		expect(parseWowheadTooltip({})).toEqual({
			name: "Unknown Item",
			quality: 0,
			level: null,
			classs: null,
			subclass: null,
			icon: null,
			iconName: null,
			description: null,
			stats: [],
			salePrice: null,
			category: "Miscellaneous",
		});
	});
	it("extracts stat lines and sale price", () => {
		const item = parseWowheadTooltip({
			tooltip: "+5 Agility\n12 Stamina\nflavour\nSells for: 1g 2s 3c",
		});
		expect(item.stats).toEqual(["+5 Agility", "12 Stamina"]);
		expect(item.salePrice).toEqual({ gold: 1, silver: 2, copper: 3 });
	});
	it("builds the category from class and subclass", () => {
		expect(
			parseWowheadTooltip({ class: "Weapon", subclass: "Sword" }).category,
		).toBe("Weapon - Sword");
	});
});
