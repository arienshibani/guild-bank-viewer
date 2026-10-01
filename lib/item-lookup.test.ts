import { describe, expect, it, vi } from "vitest";
import { createItemLookup } from "./item-lookup";

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe("createItemLookup", () => {
	it("shares one request between concurrent and repeated lookups", async () => {
		const fetcher = vi.fn(async () => ok({ name: "A", quality: 1 }));
		const lookup = createItemLookup(fetcher);
		const [a, b] = await Promise.all([lookup(1, "classic"), lookup(1, "classic")]);
		await lookup(1, "classic");
		expect(a).toBe(b);
		expect(fetcher).toHaveBeenCalledTimes(1);
		expect(fetcher).toHaveBeenCalledWith("/api/item/1?gameMode=classic");
	});
	it("keeps game modes and items separate", async () => {
		const fetcher = vi.fn(async () => ok({}));
		const lookup = createItemLookup(fetcher);
		await lookup(1, "classic");
		await lookup(1, "retail");
		await lookup(2, "classic");
		expect(fetcher).toHaveBeenCalledTimes(3);
	});
	it("does not cache failures", async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(new Response("", { status: 500 }))
			.mockResolvedValueOnce(ok({ name: "A" }));
		const lookup = createItemLookup(fetcher);
		await expect(lookup(1)).rejects.toThrow("Failed to fetch item data");
		await expect(lookup(1)).resolves.toMatchObject({ name: "A" });
		expect(fetcher).toHaveBeenCalledTimes(2);
	});
});

describe("createItemLookup 404 handling", () => {
	it("rejects with ItemNotFoundError on a 404 and does not cache it", async () => {
		const { ItemNotFoundError } = await import("./item-lookup");
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(new Response("", { status: 404 }))
			.mockResolvedValueOnce(ok({ name: "A" }));
		const lookup = createItemLookup(fetcher);
		await expect(lookup(1, "classic")).rejects.toBeInstanceOf(ItemNotFoundError);
		await expect(lookup(1, "classic")).resolves.toMatchObject({ name: "A" });
	});
});
