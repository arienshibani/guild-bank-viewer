import { describe, expect, it } from "vitest";
import {
	parseSearchResults,
	parseWowheadTooltip,
	searchUrl,
	tooltipUrl,
} from "./wowhead";

describe("tooltipUrl", () => {
	it("uses a game-mode path for classic-era modes", () => {
		expect(tooltipUrl(19019, "classic")).toBe(
			"https://nether.wowhead.com/classic/tooltip/item/19019?json",
		);
		expect(tooltipUrl("1", "wotlk")).toContain("/wotlk/tooltip/item/1");
		expect(tooltipUrl("1", "cata")).toContain("/cata/tooltip/item/1");
		expect(tooltipUrl("1", "mop-classic")).toContain(
			"/mop-classic/tooltip/item/1",
		);
		expect(tooltipUrl(277288, "forever")).toBe(
			"https://nether.wowhead.com/forever/tooltip/item/277288?json",
		);
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

describe("searchUrl", () => {
	it("scopes the search to the game mode and encodes the query", () => {
		expect(searchUrl("pathfinder's clearway", "forever")).toBe(
			"https://www.wowhead.com/forever/search/suggestions-template?q=pathfinder's%20clearway",
		);
		expect(searchUrl("x", "classic")).toContain("/classic/search/");
		expect(searchUrl("x", "retail")).toBe(
			"https://www.wowhead.com/search/suggestions-template?q=x",
		);
	});
});

describe("parseSearchResults", () => {
	it("keeps only items and maps the fields", () => {
		const results = parseSearchResults({
			results: [
				{ type: 6, id: 1, name: "Thunderfury", icon: "spell_nature_cyclone" },
				{
					type: 3,
					id: 19019,
					name: "Thunderfury, Blessed Blade of the Windseeker",
					icon: "inv_sword_39",
					quality: 5,
					pinFooterText: "One-Handed Sword",
					pinBreadcrumb: ["Weapon", "One-Handed Sword"],
				},
				{ type: 3, id: 2, name: "Plain", pinBreadcrumb: ["Armor", "Cloth"] },
				{ type: 3, name: "No id" },
			],
		});
		expect(results).toEqual([
			{
				id: 19019,
				name: "Thunderfury, Blessed Blade of the Windseeker",
				icon: "inv_sword_39",
				quality: 5,
				subtitle: "One-Handed Sword",
			},
			{ id: 2, name: "Plain", icon: null, quality: 0, subtitle: "Armor - Cloth" },
		]);
	});
	it("returns an empty list for malformed responses", () => {
		for (const bad of [null, {}, { results: "x" }, "nope"]) {
			expect(parseSearchResults(bad)).toEqual([]);
		}
	});
});
