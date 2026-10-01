import type { GameMode } from "@/lib/types";
import type { ItemSearchResult } from "@/lib/wowhead";

export type SearchFetcher = (url: string, signal?: AbortSignal) => Promise<Response>;

export const MIN_QUERY_LENGTH = 2;

/** Client-side item search over /api/item-search, scoped to a game mode. */
export function createItemSearch(
	fetcher: SearchFetcher = (url, signal) => fetch(url, { signal }),
) {
	return async function searchItems(
		query: string,
		gameMode: GameMode,
		signal?: AbortSignal,
	): Promise<ItemSearchResult[]> {
		const q = query.trim();
		if (q.length < MIN_QUERY_LENGTH) return [];

		const response = await fetcher(
			`/api/item-search?q=${encodeURIComponent(q)}&gameMode=${encodeURIComponent(gameMode)}`,
			signal,
		);
		if (!response.ok) throw new Error("Failed to search items");
		return (await response.json()) as ItemSearchResult[];
	};
}

export const searchItems = createItemSearch();
