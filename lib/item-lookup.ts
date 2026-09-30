import type { GameMode } from "@/lib/types";
import type { ItemData } from "@/lib/wowhead";

export type ItemFetcher = (url: string) => Promise<Response>;

/**
 * Client-side item lookup. Concurrent and repeated lookups for the same
 * (gameMode, itemId) share one request; failures are not cached.
 */
export function createItemLookup(fetcher: ItemFetcher = (url) => fetch(url)) {
	const cache = new Map<string, Promise<ItemData>>();

	return function lookupItem(
		itemId: number,
		gameMode?: GameMode,
	): Promise<ItemData> {
		const key = `${gameMode ?? ""}:${itemId}`;
		const cached = cache.get(key);
		if (cached) return cached;

		const query = gameMode ? `?gameMode=${encodeURIComponent(gameMode)}` : "";
		const request = fetcher(`/api/item/${itemId}${query}`)
			.then((response) => {
				if (!response.ok) throw new Error("Failed to fetch item data");
				return response.json() as Promise<ItemData>;
			})
			.catch((error) => {
				cache.delete(key);
				throw error;
			});
		cache.set(key, request);
		return request;
	};
}

export const lookupItem = createItemLookup();
