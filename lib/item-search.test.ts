import { describe, expect, it, vi } from "vitest";
import { createItemSearch } from "./item-search";

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe("createItemSearch", () => {
	it("skips the request for queries that are too short", async () => {
		const fetcher = vi.fn();
		const search = createItemSearch(fetcher);
		expect(await search(" a ", "classic")).toEqual([]);
		expect(fetcher).not.toHaveBeenCalled();
	});
	it("searches within the game mode and trims/encodes the query", async () => {
		const fetcher = vi.fn(async () => ok([{ id: 1, name: "A" }]));
		const search = createItemSearch(fetcher);
		expect(await search(" sword of x ", "wotlk")).toEqual([{ id: 1, name: "A" }]);
		expect(fetcher).toHaveBeenCalledWith(
			"/api/item-search?q=sword%20of%20x&gameMode=wotlk",
			undefined,
		);
	});
	it("rejects when the server errors", async () => {
		const search = createItemSearch(async () => new Response("", { status: 500 }));
		await expect(search("sword", "classic")).rejects.toThrow("Failed to search items");
	});
});
