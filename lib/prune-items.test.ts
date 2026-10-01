import { describe, expect, it, vi } from "vitest";
import type { BankItem } from "./bank-items";
import { createItemLookup, ItemNotFoundError } from "./item-lookup";
import { pruneUnavailableItems } from "./prune-items";

const item = (
	slot_number: number,
	item_id: number,
	quantity = 1,
): BankItem => ({
	slot_number,
	item_id,
	quantity,
});

describe("pruneUnavailableItems", () => {
	it("removes items that do not exist in the game mode and keeps the rest", async () => {
		const lookup = vi.fn(async (id: number) => {
			if (id === 36942) throw new ItemNotFoundError(id);
			return { name: "x" } as never;
		});
		const items = [item(0, 19019), item(1, 36942, 3), item(2, 2589)];
		const result = await pruneUnavailableItems(items, "classic", lookup);
		expect(result.removed).toEqual([item(1, 36942, 3)]);
		expect(result.kept).toEqual([item(0, 19019), item(2, 2589)]);
		expect(lookup).toHaveBeenCalledWith(36942, "classic");
	});

	it("keeps items it could not check because of a non-404 failure", async () => {
		const lookup = vi.fn(async () => {
			throw new Error("network down");
		});
		const items = [item(0, 19019)];
		const result = await pruneUnavailableItems(items, "classic", lookup);
		expect(result).toEqual({ kept: items, removed: [] });
	});

	it("looks each distinct item up once and removes every slot holding it", async () => {
		const lookup = vi.fn(async (id: number) => {
			throw new ItemNotFoundError(id);
		});
		const items = [item(0, 5), item(7, 5)];
		const result = await pruneUnavailableItems(items, "classic", lookup);
		expect(result.removed).toEqual(items);
		expect(lookup).toHaveBeenCalledTimes(1);
	});

	it("treats a 404 from the real lookup as not available", async () => {
		const lookup = createItemLookup(async (url) =>
			url.includes("/36942")
				? new Response("", { status: 404 })
				: new Response("{}", { status: 200 }),
		);
		const result = await pruneUnavailableItems(
			[item(0, 36942), item(1, 19019)],
			"classic",
			lookup,
		);
		expect(result.removed.map((i) => i.item_id)).toEqual([36942]);
		expect(result.kept.map((i) => i.item_id)).toEqual([19019]);
	});

	it("returns empty lists for no items without any lookups", async () => {
		const lookup = vi.fn();
		expect(await pruneUnavailableItems([], "classic", lookup as never)).toEqual(
			{ kept: [], removed: [] },
		);
		expect(lookup).not.toHaveBeenCalled();
	});
});
